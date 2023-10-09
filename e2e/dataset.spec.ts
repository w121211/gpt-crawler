import { test, expect } from "@playwright/test";
import { Dataset } from "crawlee";

test("dataset save & load", async () => {
  const dataset = await Dataset.open("my-dataset");

  // Save some data
  await dataset.pushData([{ foo: "bar" }, { hello: "world" }]);

  // Load the data back
  const loadedDataset = await Dataset.open("my-dataset");
  const data = await loadedDataset.getData();

  expect(data.items).toEqual([{ foo: "bar" }, { hello: "world" }]);

  await dataset.drop();
});
