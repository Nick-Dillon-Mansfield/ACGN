/*
1. need a server
	- gorilla/mux (go's version of express.js) - Gorilla is a CRUD
		DONE
2. receive a basic request
	- make a simple get request, using insomnia, to check code works
		DONE
	-

*/

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/BrianAllred/goydl"
	"github.com/gorilla/mux"
)

var endResult = "This will be the yt audio eventually"

func returnHello(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode("Hello there!")
}

func getAudio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	// params is now set to all the endpoints put in the path - the youtube URL would be {id}, as set by the main()
	dlLink := "https://www.youtube.com/watch?v=" + params["id"]

	youtubeDl := goydl.NewYoutubeDl()
	youtubeDl.Options.Output.Value = "./" + params["id"] + ".mp3"
	youtubeDl.Options.ExtractAudio.Value = true
	youtubeDl.Options.AudioFormat.Value = "mp3"

	cmd, err := youtubeDl.Download(dlLink)
	if err != nil {
		log.Fatal(err)
	}
	go io.Copy(os.Stdout, youtubeDl.Stdout)
	go io.Copy(os.Stderr, youtubeDl.Stderr)
	fmt.Printf("title: %s\n", youtubeDl.Info.Title)
	defer cmd.Wait()
	fmt.Println(params)
	fmt.Println(`The dlLink is -`, dlLink)
	json.NewEncoder(w).Encode(endResult)
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api", returnHello).Methods("GET")
	router.HandleFunc("/api/yturl/{id}", getAudio).Methods("GET")

	log.Fatal(http.ListenAndServe(":8000", router))

}
