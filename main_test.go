package main_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetRequestMain(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api", nil)
	res := httptest.NewRecorder()
	returnHello().ServeHTTP(res, req)

	if res.Body.String() != "Hello bear!" {
		t.Error("Expected Hello bear but got ", res.Body.String())
	}
}
