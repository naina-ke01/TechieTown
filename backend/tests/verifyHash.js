import bcrypt from "bcrypt";

const plain = "TechieTown@2025";
const hash = "$2b$10$kOjM02jHy3TXhP5HlmGeaeQNTUIy4c6jw9pV50esC6PB2anJlHdWG";

bcrypt.compare(plain, hash).then(result => {
  console.log("Match:", result);
});
