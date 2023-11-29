import { Configuration, OpenAIApi } from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PdfReader } from "pdfreader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// constants
const COMPLETIONS_MODEL = "text-davinci-003";
const EMBEDDING_MODEL = "text-embedding-ada-002";

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());
const EMBEDDINGS={};

const configuration = new Configuration({
  organization: "org-IriqN8QIdlAlLpQXUpuHs4Bp",
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);
function cosineSimilarity(A, B) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  return dotProduct / (normA * normB);
}

function getSimilarityScore(embeddingsHash, promptEmbedding) {
  const similarityScoreHash = {};
  Object.keys(embeddingsHash).forEach((text) => {
    console.log("here")
    console.log(JSON.parse(embeddingsHash[text]))
    similarityScoreHash[text] = cosineSimilarity(
      promptEmbedding,
      JSON.parse(embeddingsHash[text])
    );
  });
  return similarityScoreHash;
}

const parsePdfFile = (filePath) => {
  return new Promise((resolve, reject) => {
    new PdfReader().parseFileItems(filePath, (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        resolve(null); // Signal the end of the file
      } else if (item.text) {
        resolve(item.text);
      }
    });
  });
};

const makeEmbded = async(saveAs) => {
  const data = await parsePdfFile(saveAs)
  const promptEmbeddingsResponse = await openai.createEmbedding({
    model: EMBEDDING_MODEL,
    input: data,
    max_tokens: 64,
  });
  const promptEmbedding = promptEmbeddingsResponse.data.data[0].embedding;
  EMBEDDINGS[data] = promptEmbedding;
  console.log(EMBEDDINGS)
}

app.use(
  fileUpload({
    useTempFiles: true,
    safeFileNames: true,
    preserveExtension: true,
    tempFileDir: `${__dirname}/public/files/temp`
  })
);

app.post('/ask', async(req, res, next) => {
  const { chats } = req.body;
  console.log(chats);
  const prompt = chats[0].content;
  console.log(prompt)
  const promptEmbeddingsResponse = await openai.createEmbedding({
    model: EMBEDDING_MODEL,
    input: prompt,
    max_tokens: 64,
  });
 
  const promptEmbedding = promptEmbeddingsResponse.data.data[0].embedding;
  // create map of text against similarity score
  const similarityScoreHash = getSimilarityScore(
    EMBEDDINGS,
    promptEmbedding
  );
  console.log(similarityScoreHash)

  // get text (i.e. key) from score map that has highest similarity score
  const textWithHighestScore = Object.keys(similarityScoreHash).reduce(
    (a, b) => (similarityScoreHash[a] > similarityScoreHash[b] ? a : b)
  );

  // build final prompt
  const finalPrompt = `
    Info: ${textWithHighestScore}
    Question: ${prompt}
    Answer:
  `;

  const response = await openai.createCompletion({
    model: COMPLETIONS_MODEL,
    prompt: finalPrompt,
    max_tokens: 64,
  });

  const completion = response.data.choices[0].text;

  return res.status(200).json({
    success: true,
    message: completion,
  });

});

app.post('/upload', async(req, res, next) => {
  let uploadFile = req.files.file;
  const name = uploadFile.name;
  const saveAs = `${name}`;

  uploadFile.mv(`${__dirname}/public/files/${saveAs}`, async function(err) {
    if (err) {
      return res.status(500).send(err);
    }
    makeEmbded(`${__dirname}/public/files/${saveAs}`)
    return res.status(200).json({ status: 'uploaded', name, saveAs });
  });
});

app.post("/", async (request, response) => {
  const { chats } = request.body;

  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a EbereGPT. You can help with graphic design tasks",
      },
      ...chats,
    ],
  });

  response.json({
    output: result.data.choices[0].message,
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
