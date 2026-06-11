# N8N Local Development Guilde:

## Installation:

- Head to https://docs.n8n.io/hosting/, it has comprehensive guilde on how to install the n8n. (npm way is easier, but recommended is install using Docker.)
- If Docker is not available, then install Docker first from https://docs.docker.com/get-started/get-docker.
- Now from documentation Starting n8n,open the terminal or powershell and run the below command to create docker volume.

  ```bash 
  docker volume create n8n_data 
  ```
  (If Docker not available , then restart the system and run or check the system variables)

- Now run the next command below which is used to run the local

    ```bash
    docker run -it --rm
    --name n8n
    -p 5678:5678
    -e GENERIC_TIMEZONE="my_timezone_from_the_system"
    -e TZ="my_timezone_from_the_system"
    -e N8N_ENFORCE_SETTINGS_FILE_PERMISSONS=true
    -e N8N_RUNNERS_ENABLED=true
    -v n8n_data:/home/node/.n8n
    docker.n8n.io/n8nio/n8n
    ```

- After the download and install, ignore the error regaring the python 3 as it is saying that in the container mini system, the python 3 is not present.
- The localhost url which is inside the container is mapped to the system localhost, hence we can access the url in the browser,
  pressing o to open the browser won't work as it is inside the container.

- Now to connect a host like Ollama we need a host in the container, to do that update the command above with 1 more line,

    ```bash
    _docker run -it --rm
    --name n8n
    -p 5678:5678
    --add-host=host.docker.internal:host-gateway
    -e GENERIC_TIMEZONE="my_timezone_from_the_system"
    -e TZ="my_timezone_from_the_system"
    -e N8N_ENFORCE_SETTINGS_FILE_PERMISSONS=true
    -e N8N_RUNNERS_ENABLED=true
    -v n8n_data:/home/node/.n8n
    docker.n8n.io/n8nio/n8n
    ```
- Now in connecting the ollama in n8n, the base url should be the one in the docker whihc is http://host.docker.internal:ollama_running_port.
  _(Only downloaded models will be visible in model dropdown in n8n ollama node.)_

## Tool to extract text from PDF:
 1. Take a file from any storage like google drive or something where files are stored > download the file _(make sure to cover the access relateed queries with OAuth2 or similar authentication for security)_
 2. In n8n there is a node called Extract from PDF or any other conditionally with if node in the middle and use the information and fed it into the Ai model or do anything as per the task.

## Webscraping tool:
  **FireCrawl** is the tool that is used to extract information from web scraping with links which is supportable to LLMs.


