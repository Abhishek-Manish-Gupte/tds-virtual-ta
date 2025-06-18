const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");

const BASE_URL = "https://discourse.onlinedegree.iitm.ac.in";
const CATEGORY_ID = 30; // TDS category ID (example)
const DATE_LIMIT = new Date("2025-04-14");

async function fetchTopicList() {
  const url = `${BASE_URL}/c/tds/${CATEGORY_ID}.json`;
  const res = await axios.get(url);
  return res.data.topic_list.topics;
}

async function fetchPostContent(topicId) {
  const url = `${BASE_URL}/t/${topicId}.json`;
  const res = await axios.get(url);
  return res.data.post_stream.posts.map(p => p.cooked).join("\n");
}

(async () => {
  const topics = await fetchTopicList();
  const output = [];

  for (let topic of topics) {
    const createdAt = new Date(topic.created_at);
    if (createdAt > DATE_LIMIT) continue;

    const content = await fetchPostContent(topic.id);
    output.push({
      id: topic.id,
      title: topic.title,
      content: content.replace(/<[^>]*>?/gm, ""), // remove HTML
      url: `${BASE_URL}/t/${topic.slug}/${topic.id}`
    });

    console.log(`✅ Scraped: ${topic.title}`);
  }

  fs.writeFileSync("discourse_data.json", JSON.stringify(output, null, 2));
  console.log("📦 All discourse data saved to discourse_data.json");
})();
