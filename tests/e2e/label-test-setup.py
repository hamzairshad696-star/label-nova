exec(open("/tmp/p5lib.py").read())
aS=session("hm621496@gmail.com","LocalOnlyTestPw-123")
def acct(name,email,role):
    o=call(aS,"createAccountAction",{"name":name,"email":email,"role":role,"password":"Phase5Pass-2026"},path="/admin/users/new"); assert o.get("ok"),o; return o["id"]
lena=acct("Lena Park","lena@p5.test","CLIENT"); omar=acct("Omar Diaz","omar@p5.test","CLIENT"); dana=acct("Dana Mercer","dana@p5.test","DEALER")
def top(uid,amt): assert call(aS,"walletEntryAction",{"userId":uid,"type":"top_up","amount":amt,"note":"Test funds","idempotencyKey":str(uuid.uuid4())},path="/admin/users").get("ok")
top(lena,"20.00"); top(omar,"50.00"); top(dana,"50.00")
ln=call(aS,"createCarrierAction",{"name":"Label Nova","key":"label_nova"})["id"]; us=call(aS,"createCarrierAction",{"name":"USPS","key":"usps"})["id"]
std=call(aS,"createServiceAction",{"carrierId":ln,"name":"Standard label","key":"standard","kind":"label_only","transitMinDays":"2","transitMaxDays":"4"})["id"]
exp=call(aS,"createServiceAction",{"carrierId":ln,"name":"Express label","key":"express","kind":"label_only","transitMinDays":"1","transitMaxDays":"1"})["id"]
gnd=call(aS,"createServiceAction",{"carrierId":us,"name":"Ground Advantage","key":"ground_advantage","kind":"carrier_postage","transitMinDays":"2","transitMaxDays":"5"})["id"]
def rule(svc,mn,mx,cu,de,re,cost=""): o=call(aS,"createRuleAction",{"serviceId":svc,"weightMinOz":str(mn),"weightMaxOz":str(mx),"cost":cost,"customer":cu,"dealer":de,"reseller":re}); assert o.get("ok"),o
rule(std,1,16,"4.99","3.99","4.49","2.00"); rule(std,17,48,"6.99","5.49","6.29","3.10"); rule(exp,1,48,"9.99","8.49","9.29"); rule(gnd,1,48,"6.49","5.49","5.99","4.10")
print(json.dumps({"lena":lena,"omar":omar,"dana":dana,"std":std,"exp":exp,"gnd":gnd}))
json.dump({"lena":lena,"omar":omar,"dana":dana,"std":std,"exp":exp,"gnd":gnd},open("/tmp/p5ids.json","w"))
