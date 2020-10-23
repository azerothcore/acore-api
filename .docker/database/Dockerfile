FROM mysql:5.7

# List of timezones: http://en.wikipedia.org/wiki/List_of_tz_database_time_zones

# set timezone environment variable
ENV TZ=Etc/UTC

ENV LANG C.UTF-8

HEALTHCHECK --interval=5s --timeout=15s --start-period=30s --retries=3 CMD mysqladmin -uroot -p$MYSQL_ROOT_PASSWORD ping -h localhost
