#!/usr/bin/env cmd
@echo off
setlocal
if "%SITE_ORIGIN%"=="" set SITE_ORIGIN=https://zlatkomarjanovic.github.io/fiverr-gigs
call npm run check
