# Competitor Researcher

This is a project that let's you get information on a comeptitor's website and add it to your notion.

- It's built using Next.js, Python and composio SDK (it makes it soooo easy to add the info to notion).

## To setup the project, follow these instructions
### To setup the backend:
- Go to the backend directory '''cd ./backend'''
- Create a virtual env (we used python3.12) using '''python -m venv env'''
- Install the required packages - '''pip install -r requirements.txt'''
- Run the python file - '''python main.py'''

### To setup the frontend:
- Go to the frontend dir - '''cd ./frontend'''
- Install the required packages, run - '''npm i'''
- Create a file called .env.local and add '''NEXT_PUBLIC_BASE_URL = http://127.0.0.1:5000''' (OR  what ever you choose your dev server to be)
- Run the development server by using - '''npm run dev'''

Now add some awesome features and send us a PR.

