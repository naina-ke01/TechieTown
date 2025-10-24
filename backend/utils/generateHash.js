import bcrypt from "bcrypt";

const plain = "TechieTown@2025";

bcrypt.hash(plain, 10).then(hash => {
  console.log("Generated hash:", hash);
});
