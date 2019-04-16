import axios from "axios";

const backEndEndPoint = "";

export const postUrl = async url => {
  const { data } = await axios.post(`${backEndEndPoint}`, url).catch(err => {
    console.log(err);
  });
  return data;
};
