const express = require('express');
const basicAuth = require('express-basic-auth')
const path = require('path');
const multer  = require('multer')
const XLSX = require('xlsx')
const axios = require('axios');
const Template = require('./Template.js');
const ErrorCollector = require('./ErrorCollector.js');
const app = express();
const cors = require("cors");
const bodyParser= require('body-parser');
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors());

const apikey = `1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5`;
var upload = multer()

async function getDataFromCRM() {

  await getCompaniesCRM().then(responseCompanies => {
    for(element of responseCompanies.data.companies) {
      companiesFromCRM.push(element.properties.name.value);
  }
  }).catch(function (error) {
    let message = error.message;
    errorCollector.add(ErrorCollector.SPECIAL_ERROR_LINE(), message, ErrorCollector.ERROR_CODE());
    console.log("getCompaniesCRM ", message);
  })
  
  await getContactsCRM().then(responseContacts => {
    for(element of responseContacts.data.contacts) {
      contactsFromCRM.push(element["identity-profiles"][0].identities[0].value);
    }
  }).catch(function (error) {
    let message = error.message;
    errorCollector.add(ErrorCollector.SPECIAL_ERROR_LINE(),message,ErrorCollector.ERROR_CODE());
    console.log("Error getcontactscrm ", message);
  })
}

async function postCompanies(postUrl,dataCompany){
  let res = {};
  try {
    res = await axios.post(postUrl, dataCompany);
    numCompanias++;
  } catch (error) {
    let message = error.message;
    errorCollector.add(currentLine, message, ErrorCollector.ERROR_CODE());
    console.log("Este es el error al crear una compañia ", message);
    
  }
  return res;
}

async function crearUnaEmpresa(empresa){
  if (empresa[0] === 'undefined') return -1;
  let existelaCompania = await laEmpresaYaEstaEnElCRM(empresa[0]);
  let dataPostCompaniasId = -1;

  if(!existelaCompania){
    companiesFromCRM.push(empresa[0]) //agrega la empresa a companies from crm
    const urlPostCompany = `https://api.hubapi.com/companies/v2/companies?hapikey=${apikey}`;
    let dataCompany = {
      properties: [
        {
          name: "name",
          value: empresa[0]
        },
        {
          name: "website",
          value: empresa[1]
        },
        {
          name: "industry", 
          value: empresa[2]
        },
        {
          name: "state", 
          value: empresa[3]
        }                  
      ]
    }
    try{
      dataPostCompanias  = await postCompanies(urlPostCompany, dataCompany);    
      dataPostCompaniasId = dataPostCompanias.data.companyId;
      
      return dataPostCompaniasId;
    } catch(error) {
      console.log("Error al crear una compañia ", error.message);
      errorCollector.add(currentLine, error.message, ErrorCollector.ERROR_CODE());
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
    errorCollector.add(currentLine, message, ErrorCollector.ERROR_CODE());
    console.log("ERROR AL CREAR UN CONTACTO ", message);
  }
  return res;
}


async function crearUnContacto(contacto){
  let idContactoCreado = -1;
  let existeElContacto =  await elContactoYaEstaEnElCRM(contacto[3]);
  if(!existeElContacto) {
    contactsFromCRM.push(contacto[3]);
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
      numContactos++;
    }
    catch(error) {
      console.log("error al crear un contacto: ", error.message);
      errorCollector.add(currentLine, error.message, ErrorCollector.ERROR_CODE());
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

  //console.log("este es el arreglo en donde algo debe estar mal: ", {contacto: contacto, contactsFromCRM: contactsFromCRM});

  if (contacto === 'undefined'){
   return true;
  }
  let contactisIncludedCRM = contactsFromCRM.includes(contacto);   
  respuesta = contactisIncludedCRM;
  return respuesta;
}

async function obtenerEmpresaDeUnaFila(element){
  let dataFilaCompania = []

  dataFilaCompania.push(String(element["NOMBRE EMPRESA"]));
  dataFilaCompania.push(String(element["PAGINA WEB"]));
  dataFilaCompania.push(String(element["INDUSTRIA"]));
  dataFilaCompania.push(String(element["PAIS"]));
  return dataFilaCompania
}

async function obtenerContactoDeUnaFila(element){
  let dataFilaContacto = []

  dataFilaContacto.push(String(element["PRIMER NOMBRE"]));
  dataFilaContacto.push(String(element["SEGUNDO NOMBRE"]));
  dataFilaContacto.push(String(element["TELEFONO DE CONTACTO"]));
  dataFilaContacto.push(String(element["EMAIL CONTACTO"]));
  return dataFilaContacto
}

async function ObtenerDataDealFilaExcel(element){
  let dataFilaDeal = []

  dataFilaDeal.push(String(element["VALOR DEAL"]));
  dataFilaDeal.push(String(element["DEAL OWNER ID"]));
  dataFilaDeal.push(String(element["PRODUCTO"]));
  dataFilaDeal.push(String(element["PAIS"]));
  dataFilaDeal.push(String(element["NOTA"]));

  return dataFilaDeal
}

async function putContactIntoCompany(urlUnionContactCompany,datacontactCompany){
  let res = {};
  try {
     res = await axios.put(urlUnionContactCompany,datacontactCompany);
  } catch (error) {
    let message = error.message;
    errorCollector.add(currentLine, message, ErrorCollector.ERROR_CODE());
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


async function postDeal(dataDeal){

  const urlPostDeal = `https://api.hubapi.com/deals/v1/deal?hapikey=${apikey}`
  let res = undefined;
  try {
     res = await axios.post(urlPostDeal,dataDeal);
     numDeals++;
  } catch (error) {
    let message = error.message;
    errorCollector.add(currentLine, message, ErrorCollector.ERROR_CODE());
    console.log("Error al hacer la unión entre contacto y empresa", error.message);
  }

  return res;

}

async function crearDealSinContacto(idDeLaEmpresa, empresa,datosDelDeal){

  let totalNameDeal = empresa +"_"+datosDelDeal[2]+"_"+datosDelDeal[3];

  
  let dataDeal = {
    associations: {
      associatedCompanyIds: [
        idDeLaEmpresa
      ]
    },
    properties: [
         {
          value: totalNameDeal,
          name: "dealname"
        },
        {
          value: "appointmentscheduled",
          name: "dealstage"
        },
        {
          value: datosDelDeal[0],
          name: "amount"
        },
              {
          value: datosDelDeal[1],
          name: "hubspot_owner_id"
        }
      ]
  }
  responsePosDeal = await postDeal(dataDeal)
  return responsePosDeal;
}
async function crearDealConContacto(idDeLaEmpresa, idContactoDeal, empresa,datosDelDeal){

  
  let totalNameDeal = empresa +"_"+datosDelDeal[2]+"_"+datosDelDeal[3];
  
  let dataDeal = {
    associations: {
      associatedCompanyIds: [
        idDeLaEmpresa
      ],
      associatedVids: [
        idContactoDeal
      ]
    },
    properties: [
         {
          value: totalNameDeal,
          name: "dealname"
        },
      {
        value: "appointmentscheduled",
        name: "dealstage"
      },
      {
        value: datosDelDeal[0],
        name: "amount"
      },
      {
        value: datosDelDeal[1],
        name: "hubspot_owner_id"
      }
     
      ]
  }
  responsePosDeal = await postDeal(dataDeal)
  return responsePosDeal;
}

async function createNote(datosDelDeal, dealId){

   
  let dataCreateNote ={
    "engagement": {
        "active": true,
        "ownerId": datosDelDeal[1],
        "type": "NOTE"
    },
    "associations": {
        "contactIds": [],
        "companyIds": [ ],
        "dealIds": [dealId],
        "ownerIds": [ ]
    },
    "metadata": {
        "body": datosDelDeal[4]
    }
}

  if(datosDelDeal[4] !== 'undefined'){
    responseCreateNote = await postCreateNote(dataCreateNote)
    return responseCreateNote;
  }else{
    console.log("la nota es indefinida");
    return -1
  }
  
}

const TWO_WEEKS_TIMESTAMP = 12096e5;
async function createTask(datosDelDeal, dealId){

  var currentDate = new Date();
  var timestamp = currentDate.getTime();

   
  let dataCreateTask ={
    "engagement": {
        "active": true,
        "ownerId": datosDelDeal[1],
        "type": "TASK",
        "timestamp": timestamp + TWO_WEEKS_TIMESTAMP
    },
    "associations": {
        "contactIds": [],
        "companyIds": [],
        "dealIds": [dealId],
        "ownerIds": []
    },
  "metadata": {
    "body": "This is the body of the task.",
    "subject": "Recordatorio de llamada",
    "status": "NOT_STARTED"
  }
}
  responseCreateTask = await postCreateTask(dataCreateTask)
  return responseCreateTask;
}


async function postCreateTask(dataTask){

  const urlPostCreateTask = `https://api.hubapi.com/engagements/v1/engagements?hapikey=${apikey}`; 
  
  let res = {};
  try {
    
     res = await axios.post(urlPostCreateTask,dataTask);
    
  } catch (error) {

    let message = error.message;
    errorCollector.add(currentLine, message, ErrorCollector.ERROR_CODE());
    console.log("Error al  crear una tarea", error.message);
    
  }

  return res;
  
}


async function postCreateNote(dataNote){

  const urlPostCreateNote = `https://api.hubapi.com/engagements/v1/engagements?hapikey=${apikey}`; 
     
  let res = {};
  try {
    
     res = await axios.post(urlPostCreateNote,dataNote);
    
  } catch (error) {
    let message = error.message;
    errorCollector.add(currentLine, message, ErrorCollector.ERROR_CODE());
    console.log("Error al crear una nota", error.message);
    
  }

  return res;

}


 async function recorrerUnExcel(dataJson){
  for (const element of dataJson) {
    currentLine++;
    if (dataJson["DEAL OWNER ID"] === '') continue;
    empresa = await obtenerEmpresaDeUnaFila(element);
    datosDelDeal = await ObtenerDataDealFilaExcel(element);

    idDeLaEmpresa =  await crearUnaEmpresa(empresa);
    if(idDeLaEmpresa == -1){
      errorCollector.add(currentLine, "El registro es invalido o la compañia ya existe en el CRM",ErrorCollector.ERROR_CODE());
      console.log("Este registro no se puede crear. Ya existe");
      continue;
    }
    contacto = await obtenerContactoDeUnaFila(element);
    idDelContacto =  await crearUnContacto(contacto);
    let rtaDeal = null ;
    let responseCreateANote = 0;
    if(idDelContacto !== -1) {
      let respuestaAsociacion = await asociacionEntreLaEmpresaYElContacto(idDeLaEmpresa, idDelContacto);
      rtaDeal = await crearDealConContacto(idDeLaEmpresa, idDelContacto, empresa[0],datosDelDeal);   
    } else {
      errorCollector.add(currentLine, "El contacto ya existe en el CRM o no hay contacto a introducir", ErrorCollector.WARNING_CODE());
      rtaDeal = await crearDealSinContacto(idDeLaEmpresa, empresa[0],datosDelDeal);
    }
    if(rtaDeal !== undefined) {
      let dealId = rtaDeal.data.dealId;
      responseCreateANote = await createNote(datosDelDeal, dealId);
      let responseCreateTask = await createTask(datosDelDeal, dealId);
    } else {
      errorCollector.add(currentLine, "Owner ID is empty", ErrorCollector.ERROR_CODE())
    }
    if(responseCreateANote == -1){
      errorCollector.add(currentLine, "Empty note", ErrorCollector.WARNING_CODE())
    }
  }
  return errorCollector.toStringArray();

}

async function main(file){
  
  companiesFromCRM = [];
  contactsFromCRM = [];
  errorCollector = new ErrorCollector();
  currentLine = 1;
  errores ="";
  numCompanias = 0;
  numContactos = 0;
  numDeals = 0;

  let workbook = XLSX.read(file, {type: "buffer"});
  let first_sheet_name = workbook.SheetNames[0];
  let worksheet = workbook.Sheets[first_sheet_name];
  let dataJson = XLSX.utils.sheet_to_json(worksheet);
  await getDataFromCRM();
  let erroresEncontrados = recorrerUnExcel(dataJson);
  return erroresEncontrados;
}

app.use(basicAuth({
  users: { 'admin': 'ssadigiCRM' },
  challenge: true,
  realm: 'Imb4T3st4pp',
}))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/public/index.html')); 
});

 
 
app.post('/upload', upload.single('file'), async function (req, res, next) {
 
   
  respuesta  = await main(req.file.buffer);
  let arregloRespuesta = []
  arregloRespuesta.push(numCompanias);
  arregloRespuesta.push(numContactos);
  arregloRespuesta.push(numDeals);
  arregloRespuesta.push(respuesta);
  res.send(arregloRespuesta);
})

app.get('/template', async function(req, res) {
  template = new Template('template.xlsx', apikey);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=" + 'template.xlsx');
  let workbook = await template.inicializarTemplate();
  if(workbook !== undefined) {
    await workbook.xlsx.write(res);
  } else {
    res.send("ha ocurrido algún error");
  }
  res.end();
})

app.use(express.static(__dirname + '/public'));

app.listen(4000, function () {
  console.log('Example app listening on port 4000!');
});

 