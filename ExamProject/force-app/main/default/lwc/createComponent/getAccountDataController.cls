public class getAccountDataController {
 
	@AuraEnabled(cacheable=true)
  public static List<AccountWrapper> getAccounts(String key) {
    list<AccountWrapper> accountWrapperList ;
    AccountWrapper wrapper;
    Map<Id,Boolean> accountAccessMap = new Map<Id,Boolean>();
    String keyword = '%'+key+'%';
    String industryDef = 'Financial Services';
    String query;
    if(String.isNotBlank(key))
     query = 'SELECT id, Name, Owner.Name,Phone, Website, AnnualRevenue FROM Account where Name like: keyword and Industry=\'Financial Services\'';
    else
     query = 'SELECT id, Name, Owner.Name,Phone, Website, AnnualRevenue FROM Account where Industry =\'Financial Services\'';
    system.debug('query'+query);
    System.debug('Database.query(query)'+ Database.query(query));
    Map<Id,Account> accountMap = new Map<Id,Account>((list<Account>)Database.query(query));
   
    for(UserRecordAccess access : [SELECT RecordId, HasEditAccess FROM UserRecordAccess WHERE recordId in:accountMap.keyset() and UserId =: UserInfo.getUserId()])
    {
        accountAccessMap.put(access.recordId,access.HasEditAccess);
        system.debug('accountAccessMap'+accountAccessMap);
    }
    accountWrapperList = new list<AccountWrapper>();
    for(Account acc: accountMap.values())
    {
        wrapper = new AccountWrapper();
        wrapper.Id = acc.Id;
        wrapper.Name = acc.Name;
        wrapper.AccountOwner = acc.Owner.Name;
        wrapper.Phone = acc.Phone;
        wrapper.Website = acc.Website;
        wrapper.AnnualRevenue = acc.AnnualRevenue;
        wrapper.isEditable = accountAccessMap.containskey(acc.Id)?accountAccessMap.get(acc.Id):false;
        system.debug('wrapper'+wrapper);
        accountWrapperList.add(wrapper);
    }
    return accountWrapperList;
  //return [SELECT id, Name, Owner.Name,Phone, Website, AnnualRevenue FROM Account where Industry = 'Financial Services'];
  }
  
  public class AccountWrapper{
    @AuraEnabled
    public String Id { get; set; }
    @AuraEnabled
    public String Name { get; set; }
    @AuraEnabled
    public String AccountOwner { get; set; }
    @AuraEnabled
    public String Phone { get; set; }
    @AuraEnabled
    public String Website { get; set; }
    @AuraEnabled
    public Decimal AnnualRevenue { get; set; }
    @AuraEnabled
    public boolean isEditable { get; set; }
  }
}