import axios from "axios";

const backEndEndPoint = "";

export const postUrl = async url => {
  const { data } = await axios.post(`${backEndEndPoint}`, url)
    .catch(console.log);
  return data;
};

export const postKeyWords = async keyWords => {
  const { data } = await axios.post(`${backEndEndPoint}`, keyWords)
    .catch(console.log)
  return data;
}