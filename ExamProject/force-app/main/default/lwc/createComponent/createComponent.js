import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/getAccountDataController.getAccounts';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class CreateComponent extends NavigationMixin(LightningElement) {
     keyword ='';
     sortDirection ;
     sortBy;
     url;
     wiredRecords;
     @track store;
     @track data;
     @track draftValues = [];

     @track columns = [
          { label: 'Account Name', fieldName: 'Name', sortable:"true", editable:{fieldName: 'isEditable'}},
            { label: 'Account', fieldName: 'AccountUrl', wrapText: true,
            type: 'url', typeAttributes: {
            label: { 
                fieldName: 'Name' 
            },
            target : '_blank'
            }
        }, 
          { label: 'Account Owner', fieldName: 'AccountOwner',sortable:"true"},
          { label: 'Phone', fieldName: 'Phone', editable:{fieldName: 'isEditable'}},
          { label: 'Website', fieldName: 'Website', editable:{fieldName: 'isEditable'}},
          { label: 'AnnualRevenue', fieldName: 'AnnualRevenue', editable:{fieldName: 'isEditable'}},
      ];

      handleSearch(event){
           this.keyword = event.target.value;
           console.log(this.keyword);
           
                getAccounts({
                     key: this.keyword
                })
                .then(result => {
                     console.log('result'+JSON.stringify(result));
                     console.log(result[0].Owner.Name);
                     this.data = result;
                })
                .catch(error => {
                     const event = new ShowToastEvent({
                          title: 'Error',
                          variant: 'error',
                          message: error.body.message,
                     });
                     this.dispatchEvent(event);
                     this.store = null;
                });
          
      }

     @wire (getAccounts, {key: '$keyword'}) 
     accountRecords(value){
          this.wiredRecords = value;
          const { data, error } = value;
          if(data){
               
                let currentData = [];

            data.forEach((row) => {
                let baseUrl = 'https://'+location.host+'/'
                let rowData = {};
                rowData.Id = row.Id;
                rowData.AccountUrl = baseUrl+row.Id;
                rowData.Name = row.Name;
                rowData.Phone = row.Phone;
                rowData.Website = row.Website;
                rowData.isEditable = row.isEditable;
                rowData.AccountOwner = row.AccountOwner;
                rowData.AnnualRevenue = row.AnnualRevenue;
                currentData.push(rowData);
            });

            this.data = currentData;
          }
          else if(error){
               this.data = undefined;
          }
     }

      onHandleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.data));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // checking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.data = parseData;
    }    

    handleSave(event)
    {
        const updatedFields = event.detail.draftValues.map(draft=>{
            const fields = {...draft};
            return {fields:fields};
        });
        const promises = updatedFields.map(input=>updateRecord(input))
        Promise.all(promises).then(()=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account Updated',
                    variant: 'success'
                })
            );
             return refreshApex(this.wiredRecords).then(() => {

                // Clear all draft values in the datatable
                this.draftValues = [];

            });
        }).catch(error=>{
            console.log(error);
             console.log(eror.body)
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating or reloading record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        })
        
        
    }

}