describe("tests", () => {
  it("types in keyword", () => {
    cy.visit("/popup.html");
    cy.get("[data-cy=keywordInput]").type("test");
    cy.get("[data-cy=submit]").click();
  });
  it("keyword to have length of 3", () => {
    cy.visit("/popup.html");
    cy.get("[data-cy=keywordInput]").type("test");
    cy.get("[data-cy=submit]").click();

    cy.get("[data-cy=resultsList]")
      .children()
      .children()
      .should("have.length", 3);
  });
  it("keyword to have length of 0 what there is no mords matching in the script", () => {
    cy.visit("/popup.html");
    cy.get("[data-cy=keywordInput]").type("abcd");
    cy.get("[data-cy=submit]").click();

    cy.get("[data-cy=resultsList]")
      .children()
      .should("have.length", 0);
  });
});
