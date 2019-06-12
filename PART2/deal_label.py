
# coding: utf-8




f = open("/Users/wenshen/Desktop/CC2019Assignment2/FILE_3.csv")
outf = open("/Users/wenshen/Desktop/CC2019Assignment2/PRE.csv","w")


count = 0
for line in f:
    ll = line.strip().split(",")
    if count == 0:
        outf.write(str(ll[3])+","+str(ll[5])+","+str(ll[1])+","+str(ll[2])+"\n")
    else:
        if int(ll[2]) == 1:
            outf.write(str(ll[3])+","+str(ll[5])+","+str(ll[1])+","+str(ll[2])+"\n")    
    
    count+=1
f.close()
outf.close()

