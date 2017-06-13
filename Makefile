all: clean lambda_function.zip

lambda_function.zip: index.js
	zip -dd -9 lambda_function.zip -r node_modules lib index.js
	@ls -lh lambda_function.zip

clean:
	rm -rf lambda_function.zip

deploy: clean lambda_function.zip
	terraform apply

.PHONY: clean deploy
