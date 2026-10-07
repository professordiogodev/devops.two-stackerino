# Two-Stackerino 🖥️ ➡️ 🧠

Two tiny apps that **talk to each other**:

| Folder      | What it is   | Language        | Default port | Speaks…                    |
| ----------- | ------------ | --------------- | ------------ | -------------------------- |
| `frontend/` | **Frontend** | Node.js/Express | `3000`       | HTML (pages for humans) 👀 |
| `backend/`  | **Backend**  | Python/Flask    | `5500`       | JSON (data for programs) 🤖 |

You already know how to run **one** app (noderino / flaskerino). Now you'll make **two** apps work together. This is what people mean by **microservices**.

---

## 0. Frontend vs Backend — what's the difference?

Think of a restaurant 🍝:

- The **frontend** is the **waiter**. It talks to the customer (you, in the browser) and presents things nicely.
- The **backend** is the **kitchen**. It does the real work and holds the data. Customers never walk into the kitchen.

In this project:

- **Backend** (`backend/app.py`) answers `GET /api/fact` with **JSON** — raw data, no colours, no layout:
  ```json
  {"fact": "Ports are like apartment numbers...", "backend_number": "1", "backend_hostname": "abc123", "time": "10:42:01"}
  ```
- **Frontend** (`frontend/index.js`) answers `GET /` with an **HTML page**. To build that page, it **calls the backend** and puts the fact inside the page.

```
  ┌──────────┐   1. GET /          ┌────────────┐  2. GET /api/fact   ┌───────────┐
  │ Browser  │ ──────────────────► │  FRONTEND  │ ──────────────────► │  BACKEND  │
  │  (you)   │ ◄────────────────── │  :3000     │ ◄────────────────── │  :5500    │
  └──────────┘   4. HTML page      └────────────┘  3. JSON data       └───────────┘
```

> [!IMPORTANT]
> 💡 **Key idea:** the backend is the frontend's **upstream** (the service it depends on). The frontend finds it using **one environment variable: `BACKEND_URL`**. Getting that URL right in every situation is the whole exercise!

### Environment variables

| App      | Variable      | Purpose                                             | Default                 |
| -------- | ------------- | --------------------------------------------------- | ----------------------- |
| backend  | `PORT`        | Port the backend listens on                         | `5500`                  |
| backend  | `NUMBER`      | A number shown on the page (to tell backends apart) | `0`                     |
| frontend | `PORT`        | Port the frontend listens on                        | `3000`                  |
| frontend | `BACKEND_URL` | **Where the frontend finds the backend**            | `http://localhost:5500` |

Both apps also have `/healthcheck`.

---

## Level 1 — Run both on your own machine (two terminals)

### 1.1 Get the code

```bash
git clone https://github.com/professordiogodev/devops.two-stackerino
cd devops.two-stackerino
```

### 1.2 Terminal 1: start the BACKEND 🧠

```bash
cd backend

# (Ubuntu only, if you don't have it) sudo apt update && sudo apt install python3-venv -y
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt

export NUMBER=1
python3 app.py
```

> [!TIP]
> ✅ Test it — open http://localhost:5500/api/fact in your browser. You should see **JSON** (ugly, raw data). That's normal: a backend makes data, not pages.

> [!WARNING]
> Leave this terminal **running**! If you close it or press `Ctrl + C`, the backend stops.

### 1.3 Terminal 2: start the FRONTEND 🖥️

Open a **new** terminal (the backend must keep running in the first one):

```bash
cd devops.two-stackerino/frontend

# (Ubuntu only, if you don't have it) sudo apt update && sudo apt install nodejs npm -y
npm install

export BACKEND_URL=http://localhost:5500
node index.js
```

> [!TIP]
> ✅ Test it — open http://localhost:3000. You should see a **nice page** with a fact inside, and "Answered by backend number **1**". Refresh: the fact changes, because every refresh = frontend calls backend again.

🎉 **Two services are talking!**

### 1.4 Break it on purpose 🔨 (very important!)

1. Go to Terminal 1 and stop the backend with `Ctrl + C`.
2. Refresh http://localhost:3000.
3. You'll see: *"Frontend is up, but the backend is unreachable"*.

The frontend is still alive — only its **upstream** is gone. Look at Terminal 2: it logs the error. Start the backend again (`python3 app.py`), refresh, and it's fixed.

> [!IMPORTANT]
> This is the #1 thing you'll debug in real life: *"Is it my app, or the thing my app depends on?"*

Stop both apps (`Ctrl + C` in each terminal) before Level 2.

---

## Level 2 — Two different servers (VMs) ☁️

The real world: frontend on one machine, backend on another. You need **2 Linux VMs** (e.g. 2 EC2 instances, same VPC/network).

```
Internet ──► [ VM-FRONTEND : 3000 ]  ──private IP──►  [ VM-BACKEND : 5500 ]
             (public, open to all)                    (only the frontend may enter)
```

### 2.1 VM-BACKEND

```bash
sudo apt update && sudo apt install git python3-venv -y
git clone https://github.com/professordiogodev/devops.two-stackerino
cd devops.two-stackerino/backend
python3 -m venv venv && source ./venv/bin/activate
pip install -r requirements.txt
export NUMBER=2
python3 app.py
```

Write down this VM's **private IP** (`hostname -I`, or in the AWS console). Example: `172.31.10.20`.

### 2.2 VM-FRONTEND

```bash
sudo apt update && sudo apt install git nodejs npm -y
git clone https://github.com/professordiogodev/devops.two-stackerino
cd devops.two-stackerino/frontend
npm install

# Use the BACKEND's PRIVATE IP here 👇
export BACKEND_URL=http://172.31.10.20:5500
node index.js
```

> [!WARNING]
> `nodejs` from `apt` must be version **18 or newer** (check with `node -v`), because we use the built-in `fetch`. If it's older, install a newer Node (e.g. via [nvm](https://github.com/nvm-sh/nvm)).

### 2.3 Firewall / Security Groups 🔐

| VM           | Allow inbound port | From                                                        |
| ------------ | ------------------ | ----------------------------------------------------------- |
| VM-FRONTEND  | `3000`             | Anywhere (`0.0.0.0/0`)                                      |
| VM-BACKEND   | `5500`             | **Only** VM-FRONTEND (its private IP or its security group) |

> [!CAUTION]
> Do **not** open the backend's port `5500` to `0.0.0.0/0`. The backend should never be reachable from the internet — only from the frontend.

Open `http://<FRONTEND-PUBLIC-IP>:3000` ✅ — "backend number **2**".

Now try `http://<BACKEND-PUBLIC-IP>:5500/api/fact` from your browser → it does **not** work. That's a **feature**: only the frontend is open to the world. Users talk to the waiter, never the kitchen. 🍝

> [!NOTE]
> In Level 1, `BACKEND_URL` was `http://localhost:5500` because both apps were on the **same** machine. Now they're on **different** machines, so `localhost` would be wrong — the frontend VM would look for the backend *on itself*. Same code, different `BACKEND_URL`. That's why it's an environment variable!

### 🩺 Debug checklist (if you see "backend unreachable")

1. Is the backend running? On VM-BACKEND: `curl localhost:5500/healthcheck`
2. Can the frontend VM reach it? On VM-FRONTEND: `curl http://<BACKEND-PRIVATE-IP>:5500/healthcheck`
   - Hangs/times out → firewall / security group 🔐
   - "Connection refused" → backend not running, or wrong port
3. Is `BACKEND_URL` correct? The frontend prints it when it starts.
4. Is the backend listening on `0.0.0.0` (all network cards) and not only `127.0.0.1`? Ours is — look at the last line of `backend/app.py`.

---

## 🏆 Challenges

1. **Change the port:** run the backend with `PORT=7000`. What else do you have to change so everything still works?
2. **Swap backends:** run two backends (`NUMBER=1` and `NUMBER=2`) on different ports. Switch the frontend between them **only** by changing `BACKEND_URL` — no code changes.
3. **Read the code:** in `frontend/index.js`, find the exact line where the frontend calls the backend.
4. **Add a field:** make the backend also return `"student": "<your name>"` and show it on the frontend page. (You must change **both** services — that's how real features work!)
5. **Explain it:** in one sentence each, explain to a classmate: what is a frontend? what is a backend? what is an upstream?

Have fun! 🚀
