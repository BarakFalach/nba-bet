#!/bin/bash

cd /Users/guymeyer/development/nba-bet/worker/tests
python local_lambda_function.py 

# Pass back return code
return_code=$?
exit $return_code 
