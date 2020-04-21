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


let dataNamesCRM = [];
let arrIndexCompaniesInCRM = [];
const urlPostCompany = "https://api.hubapi.com/companies/v2/companies?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5"
const urlPostContact = "https://api.hubapi.com/contacts/v1/contact/?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5"



// get all companies by portal 
axios.get('https://api.hubapi.com/companies/v2/companies/paged?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5&properties=name')
  .then(function (response) {
    // handle success
    response.data.companies.forEach(element => {
        dataNamesCRM.push(element.properties.name.value);
        //console.log(response.data.companies.properties.name.value);
        
    });
    InsertCompany();
    InsertContact();
    //console.log(data);
   })
  .catch(function (error) {
    // handle error
    console.log(error);
  })



  


function InsertCompany(){

 // console.log(dataJson[1]["NOMBRE DEL CONTACTO"]);
 //console.log(dataJson);


    
    
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

            
            var index = -1;
            var val = companyNameExcel
            var filteredObj = dataJson.find(function(item, i){
              console.log(item.name);
              if(item["NOMBRE EMPRESA"] === val){
               
                
                index = i;
                return i;
              }
            });

             
            arrIndexCompaniesInCRM.push(index);


            axios.post(urlPostCompany, dataCompany)

            .then( (response)=>{
                //console.log(response);
              
            }).catch((error) =>{
                console.log(error);
            });
            
        }
    
    });
}

function InsertContact(){

  dataJson.forEach(element => {

  console.log("****");
  // hay que  extraer los elementos del arreglo para poder acceder bien a los contactos
  //console.log(dataJson[element.]["NOMBRE EMPRESA"]);
  
  let dataContacts ={
    "properties": [
      {
        "property": "firstname",
        "value": "isaac"
      }
   
    ]
  }

  axios.post(urlPostContact, dataContacts)

  .then( (response)=>{
      //console.log(response);
    
  }).catch((error) =>{
      console.log(error);
  });
  
})
  
}




app.get('/', function (req, res) {

  res.send("Boom");
 
});
app.listen(4000, function () {
  console.log('Example app listening on port 4000!');
});