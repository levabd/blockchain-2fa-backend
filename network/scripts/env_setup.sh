#!/usr/bin/env bash


# Define those global variables
if [ -f ./variables.sh ]; then
 source ./variables.sh
elif [ -f scripts/variables.sh ]; then
 source scripts/variables.sh
else
	echo_r "Cannot find the variables.sh files, pls check"
	exit 1
fi

sudo apt-get update
sudo apt-get install -y libltdl3-dev build-essential curl wget tar python apt-transport-https ca-certificates

# Install docker on Ubuntu/Debian system

install_docker() {
	echo "Install Docker..."
	wget -qO- https://get.docker.com/ | sh
	sudo service docker stop
	echo "Docker Installation Done"
}

install_docker_compose() {
	echo "Install Docker-Compose..."
	command -v "curl" >/dev/null 2>&1 || sudo apt-get update && apt-get install curl -y
	curl -L https://github.com/docker/compose/releases/download/1.17.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
	sudo chmod +x /usr/local/bin/docker-compose
	docker-compose --version
	echo "Docker-Compose Installation Done"
}

install_golang() {
	echo "Install Golang..."
    
    if [ -d "$HOME/.go" ] || [ -d "$HOME/go" ]; then
    echo "The 'go' or '.go' directories already exist. Exiting."
    exit 1
    fi
    
    echo "Downloading ..."
    wget https://dl.google.com/go/go${GOLANG_VER}.linux-amd64.tar.gz -O /tmp/go.tar.gz
    
    if [ $? -ne 0 ]; then
    echo "Download failed! Exiting."
    exit 1
    fi

    echo "Extracting File..."
    tar -C "$HOME" -xzf /tmp/go.tar.gz
    mv "$HOME/go" "$HOME/.go"
    touch "$HOME/.${shell_profile}"
    {
        echo '# GoLang'
        echo 'export GOROOT=$HOME/.go'
        echo 'export PATH=$PATH:$GOROOT/bin'
        echo 'export GOPATH=$HOME/go'
        echo 'export PATH=$PATH:$GOPATH/bin'
    } >> "$HOME/.${shell_profile}"

    mkdir -p $HOME/go/{src,pkg,bin}
    echo -e "\nGo $VERSION was installed.\nMake sure to relogin into your shell or run:"
    echo -e "\n\tsource $HOME/.${shell_profile}\n\nto update your environment variables."
    echo "Tip: Opening a new terminal window usually just works. :)"
    rm -f /tmp/go.tar.gz
	echo "Golang Installation Done"    
}

install_nodejs() {
	echo "Install Node js..."
    curl -sL https://deb.nodesource.com/setup_${NODEJS_VER} | sudo -E bash -
    sudo apt-get install -y nodejs
	echo "Node js Installation Done"    
}

source /home/ubuntu/.bashrc

command -v "docker" >/dev/null 2>&1 && echo "Docker already installed" || install_docker

command -v "docker-compose" >/dev/null 2>&1 && echo "Docker-Compose already installed" || install_docker_compose

command  "go version" >/dev/null 2>&1 && echo "Golang already installed" || install_golang

command -v "nodejs" >/dev/null 2>&1 && echo "Node js already installed" || install_nodejs


echo " All prerequisites was installed successfully"
echo "1. Docker"
docker -v
echo "2. Docker-compose"
docker-compose -v
echo "3. Golang"
echo "go version go1.9.4 linux/amd64"
echo "4. Node js "
nodejs -v