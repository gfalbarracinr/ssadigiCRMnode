const express = require('express');
const XLSX = require('xlsx')
const axios = require('axios');
const app = express();
const cors = require("cors");

app.use(cors());



let workbook = XLSX.readFile('file.xlsx');
let first_sheet_name = workbook.SheetNames[0];

/* Get worksheet */
let worksheet = workbook.Sheets[first_sheet_name];
let dataJson = XLSX.utils.sheet_to_json(worksheet)
//console.log(dataJson[0]["NOMBRE EMPRESA"]);
//console.log(dataJson[0]["NOMBRE EMPRESA"]);
//console.log(dataJson);


let dataNamesCRM = [];
let dataContactsEmailCRM = []
let arrIndexCompaniesInCRM = [];
const urlPostCompany = "https://api.hubapi.com/companies/v2/companies?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5"
const urlPostContact = "https://api.hubapi.com/contacts/v1/contact/?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5"



// get all companies by portal 
async function getCompaniesCRM(){

  const response  = await axios.get('https://api.hubapi.com/companies/v2/companies/paged?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5&properties=name')
  return response;
}

async function getContactsCRM(){

  const response  = await axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5')
   return response;
}
 

getCompaniesCRM().then(function (result) {
  console.log("BAAAAAANG");
  
   
  result.data.companies.forEach(element => {
      dataNamesCRM.push(element.properties.name.value);
  });
    
  InsertCompany();
    
 }) .catch(function (error) {
  // handle error
  console.log(error);
})
//******/ 

getContactsCRM().then(function (result) {
   

  console.log("BOOOOOOM");
  
 //console.log("Estos son los resultados de los contactos: ",result.data.contacts["identity-profiles"][0].identities[0].value);
 //console.log("ESTE ES EL RESULTADO:",result);
 
 result.data.contacts.forEach(element => {
  
  //console.log("Este es el elemento: ",element["identity-profiles"][0].identities[0].value);
  dataContactsEmailCRM.push(element["identity-profiles"][0].identities[0].value);

});

 InsertContacts();
      
 }) .catch(function (error) {
  // handle error
  console.log(error);
})
 
 
 
function InsertCompany(){

    
    dataJson.forEach(element => {

 
        let companyNameExcel = element["NOMBRE EMPRESA"];
        
        let  isIncludedCRM   = dataNamesCRM.includes(companyNameExcel);


        
        let dataCompany = {
            "properties": [
              {
                "name": "name",
                "value": companyNameExcel
              }

            ]
          }
        
        if(!isIncludedCRM){

            console.log("entra");
            

            axios.post(urlPostCompany, dataCompany)

            .then( (response)=>{
                //console.log(response);
              
            }).catch((error) =>{
                console.log(error);
            });
            
        }
    
    });
}


function InsertContacts(){

    
  dataJson.forEach(element => {

      //console.log("entra datajson");

      let ContactsEmailExcel = element["EMAIL CONTACTO"];
       
      //console.log(companyContactsEmailExcel);

      let  isIncludedCRM   = dataContactsEmailCRM.includes(ContactsEmailExcel);
      
      console.log(dataContactsEmailCRM);
      
      console.log(isIncludedCRM);
      
      let dataContacts = {
          "properties": [
            {
              "property": "email",
              "value": ContactsEmailExcel
            }

          ]
        }

               
        if(!isIncludedCRM){

          console.log("entra");
          

          axios.post(urlPostContact, dataContacts)

          .then( (response)=>{
              console.log(response);
            
          }).catch((error) =>{
              console.log(error);
          });
          
      }
    
  
  });
}






app.get('/', function (req, res) {

  res.send("Boom");
 
});
app.listen(4000, function () {
  console.log('Example app listening on port 4000!');
});
 