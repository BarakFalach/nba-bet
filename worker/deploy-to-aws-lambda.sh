#!/bin/bash

cd src
zip -r ../function.zip .

printf "\n\nPushing to AWS...\n\n"
cd ..
aws lambda update-function-code --function-name test-supabase-connect --zip-file fileb://$(pwd)/function.zip

printf "\n\nExiting...\n"
