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

func getAudio(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	// params is now set to all the endpoints put in the path - the youtube URL would be {id}, as set by the main()
	dlLink := "https://www.youtube.com/watch?v=" + params["id"]

	// this is the declaration of the Go-instruction to download the youtube audio, and defines what the file name will be
	youtubeDl := goydl.NewYoutubeDl()
	youtubeDl.Options.Output.Value = "./stereoFlac.flac"
	youtubeDl.Options.ExtractAudio.Value = true
	youtubeDl.Options.AudioFormat.Value = "flac"

	cmd, err := youtubeDl.Download(dlLink)
	if err != nil {
		fmt.Println("Failed on Youtube Download, check stero flac is deleted")
		log.Fatal(err)
	}

	// This writes to the console the current read/write io
	go io.Copy(os.Stdout, youtubeDl.Stdout)
	go io.Copy(os.Stderr, youtubeDl.Stderr)
	fmt.Printf("title: %s\n", youtubeDl.Info.Title)
	cmd.Wait()

	// Creates a client.
	ctx := context.Background()
	client, err := speech.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// This is the FFMpeg functionality to convert the .flac file from stereo to mono
	var instruction = "ffmpeg"
	var args = []string{"-i", "stereoFlac.flac", "-ac", "1", "monoFlac.flac"}
	if err = exec.Command(instruction, args...).Run(); err != nil {
		fmt.Println("Failed in mono conversion")
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// Set Google Cloud Credentials
	// credentialInstruction := "export"
	// credentialArgs := []string{"GOOGLE_APPLICATION_CREDENTIALS=\"/home/andrew/go/src/github.com/mkalpha/ACGN/GoogleCloudCredentials.json\""}
	// if err = exec.Command(credentialInstruction, credentialArgs...).Run(); err != nil {
	// 	fmt.Fprintln(os.Stderr, err)
	// 	os.Exit(1)
	// }

	// Upload to Google Cloud Storage
	uploadInstruction := "gsutil"
	uploadArgs := []string{"cp", "./monoFlac.flac", "gs://acgn-audiofiles"}
	if err = exec.Command(uploadInstruction, uploadArgs...).Run(); err != nil {
		fmt.Println("Failed in upload to google cloud")
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// Deletes local audio files
	var deleteInstruction = "rm"
	var deleteArgs = []string{"stereoFlac.flac", "monoFlac.flac"}
	if err = exec.Command(deleteInstruction, deleteArgs...).Run(); err != nil {
		fmt.Println("Failed deleting local audio files")
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// Sets the name of the audio file to transcribe.
	gcsURI := "gs://acgn-audiofiles/monoFlac.flac"

	// Send a request to Google Cloud Speech to Text API and receive response
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
	op, err := client.LongRunningRecognize(ctx, req)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	resp, err := op.Wait(ctx)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// Creating response struct and JSON object

	type Word struct {
		Word string  `json:"word"`
		Time float64 `json:"time"`
	}

	type Script struct {
		Transcript string  `json:"transcript"`
		Confidence float32 `json:"confidence"`
		Words      []Word  `json:"words"`
	}

	for _, result := range resp.Results {
		for _, alternative := range result.Alternatives {
			transcript := alternative.Transcript
			confidence := alternative.Confidence
			script := Script{Transcript: transcript, Confidence: confidence}
			for _, word := range alternative.Words {
				script.Words = append(script.Words, Word{
					Word: word.Word,
					Time: math.Round(float64(word.EndTime.Seconds) + float64(word.EndTime.Nanos)*1e-9),
				})
			}

			// Send JSON object as response

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(script)
		}
	}
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api/yturl/{id}", getAudio).Methods("GET")

	log.Fatal(http.ListenAndServe(":8000", router))

}
