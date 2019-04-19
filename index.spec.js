const { expect } = require("chai");
const exampleScript = require("./db/index");
const { filterKeyword } = require("./index.js");

describe("filterKeyword", () => {
 it("returns only the object that matches the keyword", () => {
   const actual = filterKeyword(exampleScript, "hello");
   const expected = [{ word: "Hello", start_time: "0", end_time: "1" }];
   expect(actual).to.eql(expected);
 });
 it("returns only the object that matches the keyword where there is more that one", () => {
   const actual = filterKeyword(exampleScript, "script");
   const expected = [
     { start_time: "6", end_time: "7", word: "script" },
     {
       start_time: "14",
       end_time: "15",
       word: "script"
     },
     {
       start_time: "18",
       end_time: "19",
       word: "script"
     }
   ];
   expect(actual).to.eql(expected);
 });
 it("returns only the object that matches the keyword where there is more that one", () => {
   const actual = filterKeyword(exampleScript, "test");
   const expected = [
     { start_time: "5", end_time: "6", word: "test" },
     { start_time: "16", end_time: "17", word: "test" },
     { start_time: "20", end_time: "21", word: "Test" }
   ];
   expect(actual).to.eql(expected);
 });
});