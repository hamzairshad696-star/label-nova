/**
 * DEVELOPMENT ONLY. Creates one demo user per role, linked in an ownership chain.
 * Every demo account uses the @demo.labelnova.dev domain so it is easy to find and delete.
 *
 *   ALLOW_SEED=true npm run db:seed
 */
import { connect } from "./_db";
import { createUserWithRole } from "./_users";

export const DEMO_PASSWORD = "LabelNova-demo-2026";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_SEED !== "true") {
    console.error("Refusing to seed: set ALLOW_SEED=true and make sure NODE_ENV is not production.");
    process.exit(1);
  }
  const { db, close } = connect();

  const admin = await createUserWithRole(db, { name: "Nova Admin", email: "admin@demo.labelnova.dev", password: DEMO_PASSWORD, role: "ADMIN" });
  const dealer = await createUserWithRole(db, {
    name: "Dana Mercer", email: "dealer@demo.labelnova.dev", password: DEMO_PASSWORD, role: "DEALER",
    company: "Mercer Logistics", parentUserId: admin.id,
  });
  const reseller = await createUserWithRole(db, {
    name: "Ravi Shah", email: "reseller@demo.labelnova.dev", password: DEMO_PASSWORD, role: "RESELLER",
    company: "Shah Fulfilment", parentUserId: dealer.id,
  });
  await createUserWithRole(db, {
    name: "Amara Okafor", email: "client@demo.labelnova.dev", password: DEMO_PASSWORD, role: "CLIENT",
    company: "Harbor & Pine Roasters", parentUserId: reseller.id,
  });

  console.log(`Demo users ready (password: ${DEMO_PASSWORD}):`);
  for (const r of ["admin", "dealer", "reseller", "client"]) console.log(`  ${r}@demo.labelnova.dev`);
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
