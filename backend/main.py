import os
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from composio_crewai import ComposioToolset, App, ComposioSDK
from crewai import Agent, Task
# from uuid import uuid4
from langchain_openai import ChatOpenAI
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load API keys from environment variables
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError('OPENAI_API_KEY environment variable must be set.')

# Initialize OpenAI and ComposioToolset instances
llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY, model="gpt-4-turbo")
composio_crewai = ComposioToolset([App.NOTION])
logging.info(f"Composio ToolSet loaded: {composio_crewai}")

# Initialize Agent
agent = Agent(
    role="Notion Agent",
    goal="Take action on Notion.",
    backstory="You are an AI Agent with access to Notion",
    verbose=True,
    tools=composio_crewai,
    llm=llm,
)

@app.route("/authenticate", methods=["GET"])
def authenticate():
    # entity_id = uuid4()
    entity_id = request.args.get('entity_id')
    # print(entity_id)
    entity = ComposioSDK.get_entity(str(entity_id))
    if entity.is_app_authenticated(App.NOTION) == False:
        resp = entity.initiate_connection(App.NOTION)
        print(
            f"Please authenticate {App.NOTION} in the browser and come back here. URL: {resp.redirectUrl}"
        )
        # confirm  = resp.wait_until_active()
        # print(confirm)
        return jsonify({
            "URL": resp.redirectUrl, 
            "message": "success"
        })
    else:
        print(f"Entity {entity_id} is already authenticated with Notion")
        return jsonify({"message": f"error"})

@app.route("/confirm_auth", methods=["GET"])
def confirm_auth():
    entity_id = request.args.get('entity_id')
    entity = ComposioSDK.get_entity(str(entity_id))
    confirm = entity.is_app_authenticated(App.NOTION)
    print(confirm)
    return jsonify({"auth_confirmation": confirm})

def remove_tags(html: str) -> str:
    """
    Remove specific HTML tags from the given HTML string.

    Args:
        html (str): The HTML string to be cleaned.

    Returns:
        str: The cleaned HTML string with specified tags removed.
    """
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(['style', 'script', 'svg', 'path', 'clipboard-copy']):
        tag.decompose()
    return ' '.join(soup.stripped_strings)

def get_info(cleaned_html: str) -> str:
    """
    Call the OpenAI API to get information about a competitor based on the provided HTML.

    Args:
        cleaned_html (str): The cleaned HTML string to be analyzed.

    Returns:
        str: The response from the OpenAI API with information about the competitor.
    """
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are an assistant who's responsible for reading competitors website data that I'll provide you and giving me relevant information on my competitor."
            },
            {
                "role": "user",
                "content": f"This is the data of the website of one of my competitors. I want a detailed point-wise analysis. Include some stats with actual numbers, apply your own knowledge if you know about the said product but keep the data that I provide as the top priority. Have at least 7-8 points. \n Website Data: {cleaned_html}"
            },
        ]
    )
    return response.choices[0].message.content

@app.route('/scrape_website', methods=['POST'])
@cross_origin()
def scrape_website():
    """
    Scrape a website and its subpages for text content.

    Args:
        url (str): The URL of the website to be scraped.

    Returns:
        List[str]: A list of cleaned text content from the website and its subpages.
    """
    url = request.json.get('url')
    content = []
    reqs = requests.get(url)
    soup = BeautifulSoup(reqs.content, 'html.parser')
    content.append(remove_tags(reqs.content))

    urls = set()
    for link in soup.find_all('a'):
        fetch_link = f"{url}{link.get('href')}" if chr(ord(link.get('href')[0])) == '/' else link.get('href')
        if "./" in fetch_link:
            fetch_link = fetch_link.replace("./", "/")
            fetch_link = f"{url}{fetch_link}"
        urls.add(fetch_link)

    for single_link in urls:
        if "mailto" not in single_link and single_link.count('/') <= 3 and "x.com" not in single_link and "twitter.com" not in single_link:
            try:
                r = requests.get(single_link)
                content.append(remove_tags(r.content))
            except requests.exceptions.RequestException as e:
                logging.warning(f"Error scraping {single_link}: {e}")

    cleaned_content = '\n'.join(content)
    competitor_info = get_info(cleaned_content)
    return jsonify(competitor_info)

@app.route('/create_notion_page', methods=['POST'])
def create_notion_page():
    """
    Create a Notion page with information about a competitor.

    Args:
        competitor_info (str): The information about the competitor to be added to the Notion page.
        agent (Agent): The Crew AI agent instance with Notion access.
    """
    competitor_info = request.json.get('competitor_info')
    task = Task(
        description=f"Create a page by the name of the competitor if the name already exists just add something else as prefix or suffix. Create this page in the page 'Competition research' and put the pointer regarding the competitor in that page which you will create. Put the pointers as they are DO NOT change them. \n Pointers to be put in the page - {competitor_info}",
        expected_output="Confirm by listing pages that Nice page in notion around the competitor has been created.",
        agent=agent,
    )
    task.execute()
    logging.info("Notion page created.")
    return jsonify({"message": "success"})

# authenticate()

def main():
    app.run(debug=True, host='127.0.0.1', port=5000)

if __name__ == "__main__":
    main()

# application = app