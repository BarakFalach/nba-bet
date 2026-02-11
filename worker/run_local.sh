#!/bin/bash

if uname -a | grep -q "gnr-ESPRIMO-P420"; then
    BASE_PATH="/home/gnr/dev/nba-bet/worker"
    LOG_FILE="log_$(date '+%Y-%m-%d_%H-%M-%S').log"

    # update env
    cd ${BASE_PATH}
    source ./.venv/bin/activate
    source .env

    # run
    cd tests
    python local_lambda_function.py | tee ../logs/${LOG_FILE}
    
    # Pass back return code
    return_code=$?
    exit $return_code 

elif uname -a | grep -q "Guys-MacBook-Pro.local"; then
    BASE_PATH="/Users/guymeyer/development/nba-bet/worker/tests"

    cd ${BASE_PATH}
    python local_lambda_function.py 

    # Pass back return code
    return_code=$?
    exit $return_code 

else
    echo "Unknown system. Exiting."
    exit -1
fi



