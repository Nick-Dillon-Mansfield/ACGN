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
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func returnHello(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode("Hello there!")
}

func returnAudio(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST":
		fmt.Fprintf(w, "Post request received", r.PostForm)
		searchTerm := r.FormValue("searchTerm")
		fmt.Fprintf(w, "you searched for: %s", searchTerm)
	}
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api", returnHello).Methods("GET")
	router.HandleFunc("/api/yturl", returnAudio).Methods("POST")
	// router.HandleFunc("/api/search-terms", getScriptandTimestamps).Methods("POST")
	// http.Handle("/", router)

	log.Fatal(http.ListenAndServe(":8000", router))
}
