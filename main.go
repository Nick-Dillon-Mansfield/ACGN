package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"

	"github.com/BrianAllred/goydl"
	"github.com/gorilla/mux"

	speech "cloud.google.com/go/speech/apiv1"
	speechpb "google.golang.org/genproto/googleapis/cloud/speech/v1"
)

func getAudio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
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
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// Set Google Cloud Credentials
	// credentialInstruction := "export"
	// credentialArgs := []string{"GOOGLE_APPLICATION_CREDENTIALS=/home/challenbellamey/go/src/github.com/challenbellamey/ACGN/GoogleCloudCredentials.json"}
	// if err = exec.Command(credentialInstruction, credentialArgs...).Run(); err != nil {
	// 	fmt.Fprintln(os.Stderr, err)
	// 	os.Exit(1)
	// }

	// Upload to Google Cloud Storage
	uploadInstruction := "gsutil"
	uploadArgs := []string{"cp", "./monoFlac.flac", "gs://acgn-audiofiles"}
	if err = exec.Command(uploadInstruction, uploadArgs...).Run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	// Deletes local audio files
	var deleteInstruction = "rm"
	var deleteArgs = []string{"stereoFlac.flac", "monoFlac.flac"}
	if err = exec.Command(deleteInstruction, deleteArgs...).Run(); err != nil {
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

	// Prints the results. THIS WILL NEED TO BE WHERE WE SEND THE JSON OBJECT FROM B.E. TO F.E. (currently just prints)
	for _, result := range resp.Results {
		for _, alt := range result.Alternatives {
			for _, w := range alt.Words {
				fmt.Printf(
					"Word: \"%v\" (startTime=%3f, endTime=%3f)\n",
					w.Word,
					float32(w.StartTime.Seconds)+float32(w.StartTime.Nanos)*1e-9,
					float32(w.EndTime.Seconds)+float32(w.EndTime.Nanos)*1e-9,
				)
			}
		}
	}
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api/yturl/{id}", getAudio).Methods("GET")

	log.Fatal(http.ListenAndServe(":8001", router))

}
