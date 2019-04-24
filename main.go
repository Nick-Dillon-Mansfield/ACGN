package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"os/exec"

	"github.com/BrianAllred/goydl"
	"github.com/gorilla/mux"

	speech "cloud.google.com/go/speech/apiv1"
	speechpb "google.golang.org/genproto/googleapis/cloud/speech/v1"
)

// MAIN ROUTER

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api/yturl/{id}", handleGETRequest).Methods("GET")
	log.Fatal(http.ListenAndServe(":8000", router))
}

// CONTROLLERS

func handleGETRequest(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	// params is now set to all the endpoints put in the path - the youtube URL would be "id", as set by the main()
	createLocalAudioFiles(params["id"])
	uploadAudioFileToCloud()
	deleteLocalAudioFiles()
	client := createGoogleCloudClient()
	data := getScript(client)
	createAndSendJSON(w, data)
}

// MODELS

func createLocalAudioFiles(id string) {
	dlLink := "https://www.youtube.com/watch?v=" + id

	// this is the declaration of the Go-instruction to download the youtube audio, and defines what the file name will be
	youtubeDl := goydl.NewYoutubeDl()
	youtubeDl.Options.Output.Value = "./stereoFlac.flac"
	youtubeDl.Options.ExtractAudio.Value = true
	youtubeDl.Options.AudioFormat.Value = "flac"

	cmd, err := youtubeDl.Download(dlLink)
	if err != nil {
		fmt.Println("Failed on Youtube Download, check stereoFlac.flac is deleted")
		log.Fatal(err)
	}

	// This writes to the console the current read/write io
	go io.Copy(os.Stdout, youtubeDl.Stdout)
	go io.Copy(os.Stderr, youtubeDl.Stderr)
	fmt.Printf("title: %s\n", youtubeDl.Info.Title)
	cmd.Wait()

	// This is the FFMpeg functionality to convert the .flac file from stereo to mono
	var instruction = "ffmpeg"
	var args = []string{"-i", "stereoFlac.flac", "-ac", "1", "monoFlac.flac"}
	if err = exec.Command(instruction, args...).Run(); err != nil {
		fmt.Println("Failed in mono conversion")
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func uploadAudioFileToCloud() {
	uploadInstruction := "gsutil"
	uploadArgs := []string{"cp", "./monoFlac.flac", "gs://acgn-audiofiles"}
	err := exec.Command(uploadInstruction, uploadArgs...).Run()
	if err != nil {
		fmt.Println("Failed in upload to google cloud")
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func deleteLocalAudioFiles() {
	var deleteInstruction = "rm"
	var deleteArgs = []string{"stereoFlac.flac", "monoFlac.flac"}
	err := exec.Command(deleteInstruction, deleteArgs...).Run()
	if err != nil {
		fmt.Println("Failed deleting local audio files")
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func createGoogleCloudClient() *speech.Client {
	// Set Google Cloud Credentials
	os.Setenv("GOOGLE_APPLICATION_CREDENTIALS", "./GoogleCloudCredentials.json")

	// Creates a Google Cloud client.
	ctx := context.Background()
	client, err := speech.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	return client
}

func getScript(client *speech.Client) *speechpb.LongRunningRecognizeResponse {
	// Sets the name of the audio file to transcribe.
	gcsURI := "gs://acgn-audiofiles/monoFlac.flac"

	// Send a request to Google Cloud Speech to Text API
	req := &speechpb.LongRunningRecognizeRequest{
		Config: &speechpb.RecognitionConfig{
			Encoding:              speechpb.RecognitionConfig_FLAC,
			SampleRateHertz:       44100,
			LanguageCode:          "en-US",
			EnableWordTimeOffsets: true,
		},
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Uri{Uri: gcsURI},
		},
	}
	ctx := context.Background()
	op, err := client.LongRunningRecognize(ctx, req)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// Wait for response data and then return
	data, err := op.Wait(ctx)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	return data
}

func createAndSendJSON(w http.ResponseWriter, data *speechpb.LongRunningRecognizeResponse) {
	// Creating Response struct
	type Word struct {
		Word string  `json:"word"`
		Time float64 `json:"time"`
	}
	type Response struct {
		Transcript string  `json:"transcript"`
		Confidence float32 `json:"confidence"`
		Words      []Word  `json:"words"`
	}
	// Creating instance of Response struct from Speech To Text API data
	var transcript string
	var confidence float32
	var words []Word
	resultCount := 0
	for _, result := range data.Results {
		resultCount = resultCount + 1
		for _, alternative := range result.Alternatives {
			transcript = transcript + alternative.Transcript
			confidence = confidence + alternative.Confidence
			for _, word := range alternative.Words {
				words = append(words, Word{
					Word: word.Word,
					Time: math.Round(float64(word.EndTime.Seconds) + float64(word.EndTime.Nanos)*1e-9),
				})
			}
		}
	}
	response := Response{Transcript: transcript, Confidence: confidence / float32(resultCount), Words: words}

	// Convert Response struct to JSON object and send as response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
