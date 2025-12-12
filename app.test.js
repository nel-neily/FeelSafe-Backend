const request = require("supertest");
const app = require("./app");

// Fonction helper pour nettoyer un utilisateur
async function cleanUpUser(token) {
  if (token) {
    await request(app).delete(`/users/${token}`);
  }
}

it("POST/users/signup", async () => {
  let token;
  try {
    const res = await request(app).post("/users/signup").send({
      email: "supertest@gmail.com",
      password: "jesuisuntest222555",
    });

    expect(res.body.result).toBe(true);
    expect(res.body.user.email).toBe("supertest@gmail.com");

    token = res.body.user.token;
  } finally {
    await cleanUpUser(token);
  }
});

it("POST/users/signup two times", async () => {
  let token;
  try {
    const res_1 = await request(app).post("/users/signup").send({
      email: "supertest@gmail.com",
      password: "jesuisuntest222555",
    });

    expect(res_1.body.result).toBe(true);
    expect(res_1.body.user.email).toBe("supertest@gmail.com");

    token = res_1.body.user.token;

    const res_2 = await request(app).post("/users/signup").send({
      email: "supertest@gmail.com",
      password: "jesuisuntest222555",
    });

    expect(res_2.body.result).toBe(false);
    expect(res_2.body.error).toBe("User already exists");
  } finally {
    await cleanUpUser(token);
  }
});

it("DELETE/user/:token", async () => {
  let token;
  try {
    const res_1 = await request(app).post("/users/signup").send({
      email: "supertest@gmail.com",
      password: "jesuisuntest222555",
    });

    token = res_1.body.user.token;

    const res_2 = await request(app).delete(`/users/${token}`);
    expect(res_2.body.response.deletedCount).toBe(1);

    token = null;
  } finally {
    await cleanUpUser(token);
  }
});

it("POST/user/auto-signin", async () => {
  let token;
  try {
    const res_1 = await request(app).post("/users/signup").send({
      email: "supertest@gmail.com",
      password: "jesuisuntest222555",
    });
    token = res_1.body.user.token;

    const res_2 = await request(app).post(`/users/auto-signin/${token}`);
    token = res_2.body.user.token;
    expect(res_2.body.user.email).toBe(res_1.body.user.email);
  } finally {
    await cleanUpUser(token);
  }
});

async function connectUser() {
  const res = await request(app).post("/users/signup").send({
    email: "supertest@gmail.com",
    password: "jesuisuntest222555",
  });

  // Vérifier que la création a réussi
  if (!res.body.result || !res.body.user) {
    throw new Error(
      `Échec de la création de l'utilisateur: ${
        res.body.error || "Unknown error"
      }`
    );
  }

  // Retourner le token
  return res.body.user.token;
}
it("POST/users/update for addresses", async () => {
  let token = await connectUser();

  try {
    const res = await request(app)
      .post("/users/update?addresses=56 Boulevard Pereire 75017 Paris")
      .send({
        email: "supertest@gmail.com",
        coordinates: [2.759227, 48.741046],
      });

    expect(res.body.addresses).toEqual({
      address: "56 Boulevard Pereire 75017 Paris",
      coords: [2.759227, 48.741046],
    });
  } finally {
    await cleanUpUser(token);
  }
});
