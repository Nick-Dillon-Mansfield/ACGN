package main

import (
	"context"
	"fmt"
	"io"
	"io/ioutil"
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

	// Sets the name of the audio file to transcribe.
	filename := "monoFlac.flac"
	// Reads the audio file into memory.
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		log.Fatalf("Failed to read file: %v", err)
	}

	// Detects speech in the audio file. THIS WILL NEED TO BE REPLACED WITH A REQUEST FOR TIMESTAMPS AGAINST EACH WORD
	resp, err := client.Recognize(ctx, &speechpb.RecognizeRequest{
		Config: &speechpb.RecognitionConfig{
			Encoding:        speechpb.RecognitionConfig_FLAC,
			SampleRateHertz: 44100,
			LanguageCode:    "en-US",
		},
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Content{Content: data},
		},
	})
	if err != nil {
		log.Fatalf("failed to recognize: %v", err)
	}

	// Prints the results. THIS WILL NEED TO BE WHERE WE SEND THE JSON OBJECT FROM B.E. TO F.E. (currently just prints)
	for _, result := range resp.Results {
		for _, alt := range result.Alternatives {
			fmt.Printf("\"%v\" (confidence=%3f)\n", alt.Transcript, alt.Confidence)
		}
	}
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api/yturl/{id}", getAudio).Methods("GET")

	log.Fatal(http.ListenAndServe(":8001", router))

}
