const express = require('express');
const XLSX = require('xlsx')
const axios = require('axios');
const app = express();
const cors = require("cors");

 
app.use(cors());

var companiesFromCRM = [];
var contactsFromCRM = [];

async function getDataFromCRM() {

   await getCompaniesCRM().then(responseCompanies=>{
    responseCompanies.data.companies.forEach(element => {
      companiesFromCRM.push(element.properties.name.value);

  })}) .catch(function (error) {
      // handle error
      console.log("getCompaniesCRM ",error.message);
    })
  

   await getContactsCRM().then(responseContacts=>{
  responseContacts.data.contacts.forEach(element => {
  contactsFromCRM.push(element["identity-profiles"][0].identities[0].value);
  })}) .catch(function (error) {
  // handle error
  console.log("Error getcontactscrm",error.message);
  
  })
    


}


async function postCompanies(postUrl,dataCompany){

 
   
  let res = {};
  try {
    res = await axios.post(postUrl, dataCompany);
     
  } catch (error) {
    console.log("Este es el error al crear una compañia ", error.message);
    
  }
  return res;
}

async function crearUnaEmpresa(empresa){

  
  let existelaCompania = await laEmpresaYaEstaEnElCRM(empresa[0]);

  if(!existelaCompania){

    //Aqui va la petición axios para crear la empresa, debe devolver el Id
    const urlPostCompany = "https://api.hubapi.com/companies/v2/companies?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5";

    let dataCompany = {
      properties: [
        {
          name: "name",
          value: empresa[0]
        },
        {
          name: "description",
          value: empresa[1]
        }
  
      ]
    }
   
      
      let dataPostCompanias  = await postCompanies(urlPostCompany, dataCompany);
      //console.log("+++",dataPostCompanias);
      idCompaniaCreada = dataPostCompanias.data.companyId;
  
       
    //console.log("la compañia no está en el CRM");
    
		return idCompaniaCreada;
	} else {
    //console.log("la compañia ya está en el CRM");
    
		return -1; //Esto significa que la empresa ya estaba en el CRM		
	}

}




async function postContacts(postUrl,dataContacts){

  console.log("dataContacts",dataContacts);
 
  let res = {};
  try {
    
     res = await axios.post(postUrl,dataContacts);
    
  } catch (error) {
    console.log("ERROR AL CREAR UN CONTACTO ", error.message);
    
  }

  return res;
}


async function crearUnContacto(contacto){

  
  let existeElContacto =  elContactoYaEstaEnElCRM(contacto[2]);
  console.log("existe el contacto: ",existeElContacto);
  
  if(!existeElContacto){

    //Aqui va la petición axios para crear la empresa, debe devolver el Id
    const urlPostContact = "https://api.hubapi.com/contacts/v1/contact/?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5"
    
    let dataContacts = {
      properties: [
        {
          property: "email",
          value: contacto[3]
        },{
          property: "firstname",
          value: contacto[0]
        },
        {
          property: "lastname",
          value: contacto[1]
        },{
          property: "phone",
          value:  contacto[2]
        }
        
      ]
    }

     

      let dataPostContacts  = await postContacts(urlPostContact, dataContacts);
      let idContactoCreado = dataPostContacts.data;

    
     
		return idContactoCreado;
	} else {
    //console.log("la compañia ya está en el CRM");
    
		return -1; //Esto significa que la empresa ya estaba en el CRM		
	}

}




// get all companies by portal 
async function getCompaniesCRM(){

  const response  = await axios.get('https://api.hubapi.com/companies/v2/companies/paged?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5&properties=name')
 
  return response;
}

async function laEmpresaYaEstaEnElCRM(empresa){
  
      let  isIncludedCRM   = companiesFromCRM.includes(empresa);   
      respuesta = isIncludedCRM;

    return respuesta;
}

async function getContactsCRM(){

  const response  = await axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5')
 
  return response;
}



function elContactoYaEstaEnElCRM(contacto){

    let  contactisIncludedCRM   = contactsFromCRM.includes(contacto);   
    respuesta = contactisIncludedCRM;
 
  return respuesta;
}


 
function obtenerEmpresaDeUnaFila(element){

  let dataFilaCompania = []

  dataFilaCompania.push(element["NOMBRE EMPRESA"]);
  dataFilaCompania.push(element["PAGINA WEB"]);
  dataFilaCompania.push(element["INDUSTRIA"]);

  return dataFilaCompania
}

function obtenerContactoDeUnaFila(element){
  

  console.log("entra al metodo");
  

  let dataFilaContacto = []

  dataFilaContacto.push(element["PRIMER NOMBRE"]);
  dataFilaContacto.push(element["SEGUNDO NOMBRE"]);
  dataFilaContacto.push(element["TELEFONO DE CONTACTO"]);
  dataFilaContacto.push(element["EMAIL CONTACTO"]);

  //console.log("Esto es lo que debe tener el telefono", element["TELEFONO CONTACTO"] );
  //console.log("***: ",element);
   
  
  return dataFilaContacto
}


 function recorrerUnExcel(dataJson){
      
  dataJson.forEach( async function (element)  {

   
  empresa = obtenerEmpresaDeUnaFila(element);
  
  //console.log("Esta es la empresa que se añadirá ",empresa);
  
  idDeLaEmpresa =  await crearUnaEmpresa(empresa);

  //console.log("Este es el id de la empresa ",idDeLaEmpresa);
  
  
  if(idDeLaEmpresa == -1){
    console.log("ESTE REGISTRO NO SE PUEDE CREAR, YA EXISTE");
    return;
  }

  contacto = obtenerContactoDeUnaFila(element);
  
  idDelContacto =  await crearUnContacto(contacto);
  
  console.log("Este es un contacto ",idDelContacto);
  
  //console.log("Datos del contacto: ", contacto);
  
  
});
}

async function main(){

  let workbook = XLSX.readFile('file.xlsx');
  let first_sheet_name = workbook.SheetNames[0];
  /* Get worksheet */
  let worksheet = workbook.Sheets[first_sheet_name];
  let dataJson = XLSX.utils.sheet_to_json(worksheet)
  
   await getDataFromCRM();

  //console.log(dataJson);
  
  

  recorrerUnExcel(dataJson);

}

main();

// configuration server
app.get('/', function (req, res) {

  res.send("Boom");
 
});
app.listen(4001, function () {
  console.log('Example app listening on port 4000!');
});
// END configuration server
 