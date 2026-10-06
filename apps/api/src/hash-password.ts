import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Provide an admin password of at least 12 characters.");
  process.exitCode = 1;
} else {
  console.log(await bcrypt.hash(password, 12));
}
