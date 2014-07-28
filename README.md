# Coucher, tool for back couchdb

Some tools for CLI use to do db jobs...

## Install

```
sudo npm install couchdb-cli -g
```

## DB create

```
coucher database -c http://user:pass@123.123.123.123:5984 -a create -d db1,db2,db3
```

## DB delete

```
coucher database -c http://user:pass@123.123.123.123:5984 -a delete -d db1,db2,db3
```

## DB replicate

```
coucher database -c http://user:pass@123.123.123.123:5984 -a replicate -d db1,db2,db3 \
	-r http://user:pass@12.12.12.12:5984
```

## Backup view 

```
coucher view -c http://user:pass@123.123.123.123:5984 -a dump -d dbname -v view1,view2
```

## Import view from backup

```
coucher view -c http://user:pass@123.123.123.123:5984 -a import -d dbname -v view1,view2
```

