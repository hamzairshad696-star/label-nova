/**
 * Creates the first ADMIN account. Safe in production.
 *   ADMIN_EMAIL=you@company.com ADMIN_NAME="Your Name" ADMIN_PASSWORD='…' npm run db:create-admin
 * The password comes from the environment so it never lands in shell history as an argument.
 */
import { connect } from "./_db";
import { createUserWithRole } from "./_users";

async function main() {
  const { ADMIN_EMAIL: email, ADMIN_NAME: name = "Administrator", ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Use an admin password of at least 12 characters.");
    process.exit(1);
  }
  const { db, close } = connect();
  const { created } = await createUserWithRole(db, { name, email, password, role: "ADMIN" });
  console.log(created ? `Admin ${email} created.` : `${email} already exists; nothing changed.`);
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
