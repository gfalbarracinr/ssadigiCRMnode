const express = require('express');
const XLSX = require('xlsx')
const axios = require('axios');
const ErrorRecolector = require('./ErrorCollector.js');
const app = express();
const cors = require("cors");
app.use(cors());

const apikey = `22b4e662-5580-4547-bb80-b248d73cd10b`;
var companiesFromCRM = [];
var contactsFromCRM = [];
const errorCollector = new ErrorRecolector();
var currentLine = 0;

async function getDataFromCRM() {

   await getCompaniesCRM().then(responseCompanies=>{
    responseCompanies.data.companies.forEach(element => {
      companiesFromCRM.push(element.properties.name.value);
    })
  }).catch(function (error) {
    let message = error.message;
    errorCollector.add(ErrorCollector.SPECIAL_ERROR_LINE(), message);
    console.log("getCompaniesCRM ", message);
  })
  
  await getContactsCRM().then(responseContacts=>{
    responseContacts.data.contacts.forEach(element => {
      contactsFromCRM.push(element["identity-profiles"][0].identities[0].value);
    })
  }).catch(function (error) {
    let message = error.message;
    errorCollector.add(ErrorCollector.SPECIAL_ERROR_LINE(), message);
    console.log("Error getcontactscrm ", message);
  })
}


async function postCompanies(postUrl,dataCompany){
  let res = {};
  try {
    res = await axios.post(postUrl, dataCompany);
     
  } catch (error) {
    let message = error.message;
    errorCollector.add(currentLine, message);
    console.log("Este es el error al crear una compañia ", message);
    
  }
  return res;
}

async function crearUnaEmpresa(empresa){
  let existelaCompania = await laEmpresaYaEstaEnElCRM(empresa[0]);
  let dataPostCompaniasId = -1;
  if(!existelaCompania){
    const urlPostCompany = `https://api.hubapi.com/companies/v2/companies?hapikey=${apikey}`;
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
    try{
      dataPostCompanias  = await postCompanies(urlPostCompany, dataCompany);    
      dataPostCompaniasId = dataPostCompanias.data.companyId;
      return dataPostCompaniasId;
    } catch(error) {
      console.log("Error al crear una compañia ", error.message);
      errorCollector.add(currentLine, error.message);
    }
  }
  return dataPostCompaniasId;
}

async function postContacts(postUrl,dataContacts){
  
  let res = {};
  try {    
     res = await axios.post(postUrl,dataContacts);
  } catch (error) {
    let message = error.message;
    errorCollector.add(currentLine, message);
    console.log("ERROR AL CREAR UN CONTACTO ", message);
  }
  return res;
}


async function crearUnContacto(contacto){
  let idContactoCreado = -1;
  let existeElContacto =  await elContactoYaEstaEnElCRM(contacto[2]);
  if(!existeElContacto) {
    const urlPostContact = `https://api.hubapi.com/contacts/v1/contact/?hapikey=${apikey}`
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

    
    try {
      let dataPostContacts  = await postContacts(urlPostContact, dataContacts);
      idContactoCreado = dataPostContacts.data.vid;     
    }
    catch(error) {
      console.log("linea actual", currentLine);
      console.log("error al crear un contacto: ", error.message);
      errorCollector.add(currentLine, error.message);
    };
  }
  return idContactoCreado;
}

async function getCompaniesCRM(){
  const response  = await axios.get(`https://api.hubapi.com/companies/v2/companies/paged?hapikey=${apikey}&properties=name`)
  return response;
}

async function laEmpresaYaEstaEnElCRM(empresa){
      let  isIncludedCRM   = companiesFromCRM.includes(empresa);   
      respuesta = isIncludedCRM;
    return respuesta;
}

async function getContactsCRM(){
  const response  = await axios.get(`https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=${apikey}`)
  return response;
}

async function elContactoYaEstaEnElCRM(contacto){
  if (contacto === undefined) return true;
  let contactisIncludedCRM = contactsFromCRM.includes(contacto);   
  respuesta = contactisIncludedCRM;
  return respuesta;
}

async function obtenerEmpresaDeUnaFila(element){
  let dataFilaCompania = []
  dataFilaCompania.push(element["NOMBRE EMPRESA"]);
  dataFilaCompania.push(element["PAGINA WEB"]);
  dataFilaCompania.push(element["INDUSTRIA"]);
  return dataFilaCompania
}

async function obtenerContactoDeUnaFila(element){
  let dataFilaContacto = []
  dataFilaContacto.push(element["PRIMER NOMBRE"]);
  dataFilaContacto.push(element["SEGUNDO NOMBRE"]);
  dataFilaContacto.push(element["TELEFONO DE CONTACTO"]);
  dataFilaContacto.push(element["EMAIL CONTACTO"]);
  return dataFilaContacto
}

async function putContactIntoCompany(urlUnionContactCompany,datacontactCompany){
  let res = {};
  try {
     res = await axios.put(urlUnionContactCompany,datacontactCompany);
  } catch (error) {
    let message = error.message;
    errorCollector.add(errorCollector.currentLine, message);
    console.log("Error al hacer la unión entre contacto y empresa", message);
  }
  return res;
}

async function asociacionEntreLaEmpresaYElContacto(idDeLaEmpresa, idDelContacto){
  const urlUnionContactCompany = `https://api.hubapi.com/crm-associations/v1/associations?hapikey=${apikey}`;
  let datacontactCompany = {
      fromObjectId:  idDelContacto,
      toObjectId: idDeLaEmpresa,
      category: "HUBSPOT_DEFINED",
      definitionId: 1
  }

  let datacontactCompany2 = {
    fromObjectId: idDeLaEmpresa,
    toObjectId:idDelContacto,
    category: "HUBSPOT_DEFINED",
    definitionId: 2
  }

  responsePutUnion = await putContactIntoCompany(urlUnionContactCompany,datacontactCompany)
  responsePutUnion2 = await putContactIntoCompany(urlUnionContactCompany,datacontactCompany2)

  return responsePutUnion, responsePutUnion2;
  
}

 async function recorrerUnExcel(dataJson){
  for (const element of dataJson) {
    currentLine++;
    empresa = await obtenerEmpresaDeUnaFila(element);
    idDeLaEmpresa =  await crearUnaEmpresa(empresa);
    if(idDeLaEmpresa == -1){
      errorCollector.add(currentLine, "la compañia ya existe en el CRM");
      console.log("ESTE REGISTRO NO SE PUEDE CREAR, YA EXISTE");
      continue;
    }
    contacto = await obtenerContactoDeUnaFila(element);
    idDelContacto =  await crearUnContacto(contacto);
    if(idDelContacto != -1){
      let respuestaAsociacion = await asociacionEntreLaEmpresaYElContacto(idDeLaEmpresa, idDelContacto);
    } else {
      errorCollector.add(currentLine, "El contacto ya existe en el CRM o no hay contacto");
    }
  }
  console.log(errorCollector.toStringArray())
}

async function main(){

  let workbook = XLSX.readFile('file.xlsx');
  let first_sheet_name = workbook.SheetNames[0];
  let worksheet = workbook.Sheets[first_sheet_name];
  let dataJson = XLSX.utils.sheet_to_json(worksheet)
  await getDataFromCRM();
  recorrerUnExcel(dataJson);
}
main();
app.get('/', function (req, res) {
  res.send("Boom"); 
});

app.listen(4000, function () {
  console.log('Example app listening on port 4000!');
});

 