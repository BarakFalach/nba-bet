#!/bin/bash

PACKAGE_DIR=python/lib/python3.10/site-packages/

# make path if it doesnt exist
mkdir -p ${PACKAGE_DIR}

rm -rf ${PACKAGE_DIR}/*

cd ${PACKAGE_DIR}
pip3 install pydantic-core supabase --platform manylinux2014_x86_64 -t . --python-version 3.10 --only-binary=:all:
cd -

zip -r supabase-linux2014-x86_64-py3_10.zip python

# cleanup
rm -rf ${PACKAGE_DIR}/*
