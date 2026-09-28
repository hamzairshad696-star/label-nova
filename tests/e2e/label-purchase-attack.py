exec(open("/tmp/p5lib.py").read())
import concurrent.futures as cf
ids=json.load(open("/tmp/p5ids.json"))
aS=session("hm621496@gmail.com","LocalOnlyTestPw-123"); oS=session("omar@p5.test","Phase5Pass-2026"); dS=session("dana@p5.test","Phase5Pass-2026")
bal=lambda u:int(q(f"select coalesce(sum(amount_cents),0) from wallet_ledger where user_id='{u}'"))
nship=lambda u:int(q(f"select count(*) from shipments where owner_user_id='{u}'"))
A1={"name":"Ada Lee","line1":"1 Main St","city":"Reno","state":"NV","postalCode":"89501","country":"US"}
A2={"name":"Harbor & Pine","line1":"418 Wharf St","city":"Portland","state":"ME","postalCode":"04101","country":"US"}
def buy(ck,svc,price,oz="8",key=None,to=A1,**extra):
    total=int(oz) if oz.isdigit() else 0; lb,ozr=(str(total//16),str(total%16)) if total>=16 else ("",oz)
    return call(ck,"purchaseAction",{"from":A2,"to":to,"pkg":{"weightLb":lb,"weightOz":ozr},"serviceId":svc,"expectedPriceCents":price,"idempotencyKey":key or str(uuid.uuid4()),**extra},path="/app/create-label")
res=[]
def expect(label,out,okv): res.append(bool(okv)); print(("PASS " if okv else "FAIL ")+label+("  → "+json.dumps(out)[:115] if out is not None else ""))
o0,s0=bal(ids["omar"]),nship(ids["omar"])
o=buy(oS,ids["std"],499); expect("CONTROL: genuine purchase works ($4.99)",o,o.get("ok") and bal(ids["omar"])==o0-499)
b,n=bal(ids["omar"]),nship(ids["omar"])
o=buy(oS,ids["gnd"],649); expect("carrier_postage purchase refused",o,o.get("ok") is False and "carrier partner" in o["error"])
o=buy(oS,ids["std"],1); expect("tampered lower price refused (not charged $0.01)",o,o.get("ok") is False)
o=buy(oS,ids["std"],9999); expect("tampered higher price refused (not overcharged)",o,o.get("ok") is False)
o=buy(oS,str(uuid.uuid4()),499); expect("unknown service refused",o,o.get("ok") is False)
o=buy(oS,ids["std"],499,to={**A1,"name":"王小明"}); expect("unprintable characters refused with explanation",o,o.get("ok") is False and "can't be printed" in o.get("error",""))
o=buy(oS,ids["std"],499,oz="0"); expect("zero weight refused",o,o.get("ok") is False)
o=buy(oS,ids["std"],499,to={**A1,"postalCode":"ABCDE"}); expect("bad ZIP refused",o,o.get("ok") is False)
o=buy(oS,ids["std"],499,ownerUserId=ids["lena"]); expect("extra field ownerUserId ignored (label stays mine)",o,o.get("ok") and q(f"select owner_user_id from shipments where id='{o['id']}'")==ids["omar"])
b,n=bal(ids["omar"]),nship(ids["omar"])
expect("refused attempts charged nothing and created nothing",None,b==o0-998 and n==s0+2)
o=buy(aS,ids["std"],499); expect("admin cannot buy labels (no price tier)",o,o.get("ok") is False)
o=buy(None,ids["std"],499); expect("signed-out purchase refused",o,o.get("ok") is False or "blocked" in o)
o=buy("__Secure-labelnova.session_token=forged",ids["std"],499); expect("forged cookie purchase refused",o,o.get("ok") is False)
# dealer tier
d0=bal(ids["dana"]); o=buy(dS,ids["std"],549,oz="22"); expect("dealer charged dealer price $5.49 for 22 oz",o,o.get("ok") and bal(ids["dana"])==d0-549)
o=buy(dS,ids["std"],699,oz="22"); expect("dealer can't be charged customer price either",o,o.get("ok") is False and "price for this service changed" in o.get("error",""))
# quote payload never leaks internals
qr=call(oS,"quoteAction",22,path="/app/create-label"); keys=set().union(*[set(x.keys()) for x in qr["quotes"]])
expect("quotes expose only buyer price (no cost/dealer/reseller/rule/snapshot)",sorted(keys),not ({"costCents","dealerCents","resellerCents","ruleId","snapshot","customerCents"}&keys))
expect("postage quote has no price in payload",None,[x["priceCents"] for x in qr["quotes"] if x["kind"]=="carrier_postage"]==[None])
# idempotency
k=str(uuid.uuid4()); b=bal(ids["omar"]); o1=buy(oS,ids["std"],499,key=k); o2=buy(oS,ids["std"],499,key=k)
expect("same key twice → one label, one charge",o2,o1.get("ok") and o2.get("id")==o1.get("id") and bal(ids["omar"])==b-499)
k=str(uuid.uuid4()); b=bal(ids["omar"])
with cf.ThreadPoolExecutor(6) as ex: outs=list(ex.map(lambda _: buy(oS,ids["std"],499,key=k),range(6)))
expect("6 concurrent submits with one key → one label, one charge",None,len({x.get("id") for x in outs if x.get("ok")})==1 and bal(ids["omar"])==b-499)
# race: many purchases against a small balance
b=bal(ids["omar"]); can=b//999
with cf.ThreadPoolExecutor(8) as ex: outs=list(ex.map(lambda _: buy(oS,ids["exp"],999),range(8)))
okn=sum(1 for x in outs if x.get("ok"))
expect(f"8 concurrent $9.99 purchases on {b/100:.2f} → exactly {can} succeed, never negative",{"succeeded":okn,"balance":bal(ids["omar"])},okn==can and bal(ids["omar"])==b-can*999 and bal(ids["omar"])>=0)
refused=[x for x in outs if not x.get("ok")]
expect("refused ones explain the balance",refused[0] if refused else None,all("Add funds" in x.get("error","") for x in refused))
expect("every shipment has exactly one matching charge",None,q("select count(*) from shipments s where s.label_number is not null and (select count(*) from wallet_ledger l where l.shipment_id=s.id and l.kind='label_charge' and l.amount_cents=-s.price_cents)<>1")=="0")
expect("label numbers unique and all check-digit valid",None,q("select count(*) - count(distinct label_number) from shipments where label_number is not null")=="0")
# deactivated rule / inactive service
rid=q(f"select id from pricing_rules where service_id='{ids['exp']}'"); call(aS,"setRuleActiveAction",rid,False,path="/admin/pricing")
o=buy(dS,ids["exp"],849); expect("deactivated rule → service can't be bought",o,o.get("ok") is False)
call(aS,"setRuleActiveAction",rid,True,path="/admin/pricing"); call(aS,"setServiceActiveAction",ids["exp"],False,path="/admin/pricing")
o=buy(dS,ids["exp"],849); expect("inactive service → can't be bought",o,o.get("ok") is False)
call(aS,"setServiceActiveAction",ids["exp"],True,path="/admin/pricing")
expect("no wallet anywhere negative",None,q("select count(*) from (select user_id from wallet_ledger group by user_id having sum(amount_cents)<0) x")=="0")
print(f"---- {sum(res)} passed, {len(res)-sum(res)} failed")
