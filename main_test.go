package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetRequest200(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api", nil)
	res := httptest.NewRecorder()
	handler := http.HandlerFunc(returnHello)

	handler.ServeHTTP(res, req)

	if status := res.Code; status != http.StatusOK {
		t.Errorf("Did not return expected")
		fmt.Println("Did not return expected")
	}

	// expected := "Hello there!"

	// result := res.Body.String()
	// fmt.Print(reflect.TypeOf(result))
	// fmt.Print(reflect.TypeOf(expected))

	// if res.Body.String() != expected {
	// 	fmt.Print("Did not recieve correct string")
	// 	fmt.Print(res.Body)
	// 	fmt.Print(expected)
	// 	t.Errorf("Did not recieve correct string")
	// }
}
