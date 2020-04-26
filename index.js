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
          name: "description",// ESTA ES LA URL DE LA COMPANIA
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

   
  let res = {};
  try {
    
     res = await axios.post(postUrl,dataContacts);
    
  } catch (error) {
    console.log("ERROR AL CREAR UN CONTACTO ", error);
    
  }

  return res;
}


async function crearUnContacto(contacto){

  
  let existeElContacto =  await elContactoYaEstaEnElCRM(contacto[3]);

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

     console.log("Este es el valor del contacto: ",typeof(contacto[2]));
     

      let dataPostContacts  = await postContacts(urlPostContact, dataContacts);
      let idContactoCreado = dataPostContacts.data.vid;
       
    
     
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
      
      //console.log("companiesFromCRM: ",companiesFromCRM);
      //console.log("respuesta company in crm: ",respuesta);
      

    return respuesta;
}

async function getContactsCRM(){

  const response  = await axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5')
 
  return response;
}



async function elContactoYaEstaEnElCRM(contacto){
  
  console.log("Este es el contacto*",contacto);
  let respuesta  = false;
 
  if (contacto === undefined) {

    console.log("Entra acá,contacto undefined");
    
    respuesta = true;

  }else{
 
    let  contactisIncludedCRM   = contactsFromCRM.includes(contacto);   
    respuesta = contactisIncludedCRM;
 
  }
  console.log("Esta es la respuestaaa",respuesta);
  
    
  return respuesta;
}


 
async function obtenerEmpresaDeUnaFila(element){

  let dataFilaCompania = []

  dataFilaCompania.push(String(element["NOMBRE EMPRESA"]));
  dataFilaCompania.push(String(element["PAGINA WEB"]));
  dataFilaCompania.push(String(element["INDUSTRIA"]));

  return dataFilaCompania
}

async function obtenerContactoDeUnaFila(element){
  

 //console.log("entra al metodo");
  

  let dataFilaContacto = []

  dataFilaContacto.push(String(element["PRIMER NOMBRE"]));
  dataFilaContacto.push(String(element["SEGUNDO NOMBRE"]));
  dataFilaContacto.push(String(element["TELEFONO DE CONTACTO"]));
  dataFilaContacto.push(String(element["EMAIL CONTACTO"]));

  //console.log("Esto es lo que debe tener el telefono", element["TELEFONO CONTACTO"] );
  //console.log("***: ",element);
   
  
  return dataFilaContacto
}

async function putContactIntoCompany(urlUnionContactCompany,datacontactCompany){
  
  let res = {};
  try {
    
     res = await axios.put(urlUnionContactCompany,datacontactCompany);
    
  } catch (error) {
    console.log("Error al hacer la unión entre contacto y empresa", error.message);
    
  }

  return res;
}

async function asociacionEntreLaEmpresaYElContacto(idDeLaEmpresa, idDelContacto){
  

  const urlUnionContactCompany = "https://api.hubapi.com/crm-associations/v1/associations?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5"
    
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

  const urlPostDeal = "https://api.hubapi.com/deals/v1/deal?hapikey=1c76d9a3-4161-4cc3-a2d3-b30a4c6747b5"
    
  let res = {};
  try {
    
     res = await axios.post(urlPostDeal,dataDeal);
    
  } catch (error) {
    console.log("Error al hacer la unión entre contacto y empresa", error.message);
    
  }

  return res;

}

async function crearDeal(idDeLaEmpresa, idContactoDeal, empresa){

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
          value: empresa,
          name: "dealname"
        },
      {
        value: "appointmentscheduled",
        name: "dealstage"
      }
      
      ]
  }
  console.log("La data del deal: ",dataDeal);
  
  
  responsePosDeal = await postDeal(dataDeal)
  
  

  return responsePosDeal;



}


 async function recorrerUnExcel(dataJson){
      
  // dataJson.forEach( async function (element)  {
  for (const element of dataJson) {
    
  
   
  empresa = await obtenerEmpresaDeUnaFila(element);
  console.log("ESTA ES LA EMPRESA: ",empresa);
  console.log("SIGUE");
  

  //console.log("Esta es la empresa que se añadirá ",empresa);
  
  idDeLaEmpresa =  await crearUnaEmpresa(empresa);
  console.log("ESTE ES EL ID DE LA EMPRESA: ",idDeLaEmpresa);
  
  //console.log("Este es el id de la empresa ",idDeLaEmpresa);
  
  if(idDeLaEmpresa == -1){
    console.log("ESTE REGISTRO NO SE PUEDE CREAR, YA EXISTE");
    continue;
  }

  contacto = await obtenerContactoDeUnaFila(element);
  //console.log("ESTE ES EL CONTACTO: ",contacto);


  idDelContacto =  await crearUnContacto(contacto);
  //console.log("E STE ES EL ID DEL CONTACTO: ",idDelContacto);

  if(idDelContacto != -1){
  
    let respuestaAsociacion = await asociacionEntreLaEmpresaYElContacto(idDeLaEmpresa, idDelContacto);
   let rtaDeal = await crearDeal(idDeLaEmpresa, idDelContacto, empresa[0]);
  
  }else{
    
    let rtaDeal = await crearDeal(idDeLaEmpresa, "", empresa[0]);

  }
  //console.log("IDEMPRESA, IDCONTACTO: ",idDeLaEmpresa,idDelContacto);
  
    console.log("PASÓ POR ACÁ");
    
   //console.log("Esta es la respuesta del deal ",rtaDeal);
   
  //console.log("Este es un contacto ",idDelContacto);
  
  //console.log("Datos del contacto: ", contacto);
  
  
}
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
app.listen(4000, function () {
  console.log('Example app listening on port 4000!');
});
// END configuration server
 