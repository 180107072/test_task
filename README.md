Test task

### Clone repository

To clone the repository, use the following commands:

```sh
git clone https://github.com/180107072/test_task
cd test_task
pnpm install
```

### Requirement

This project requires Rabbitmq

To install run

```bash
brew install rabbitmq # on macs
choco install rabbitmq # on windows
```

### Running the app

set `.env` file with your credentials.(like DB URL)

Run the app

```bash
pnpm dev
```

This project is intended to be used with the latest Active LTS release
And uses native ESM
