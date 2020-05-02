const axios = require('axios');
const Excel = require('exceljs');
class Template {
    constructor(file, apikey) {
        this.file = file;
        this.apikey = '22b4e662-5580-4547-bb80-b248d73cd10b';
    }

    async obtenerOwnersDeHubspot() {
        const result = await axios.get(`https://api.hubapi.com/owners/v2/owners?hapikey=${this.apikey}`);
        const data = await result.data;
        return data;
    }

    obtenerIDYNombreDe(arrayUsuarios) {
        return arrayUsuarios.map((user) => {
            return {
                ownerId: user.ownerId,
                firstName : user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    }

    async inicializarTemplate() {
        
        const ownersInfo = await this.obtenerOwnersDeHubspot();
        const ownerData = this.obtenerIDYNombreDe(ownersInfo);

        try {
            const workbook = new Excel.Workbook();
            await workbook.xlsx.readFile('template.xlsx');
            const worksheet = workbook.getWorksheet('Usuarios');
            ownerData.map(row => {
                let createArray = [row.ownerId, row.firstName, row.lastName, row.email]
                worksheet.addRow(createArray).commit();
            });
            return workbook;
        } catch (error) {
            console.log("error: ", error.message);
            return undefined;
        }
    }
}
module.exports = Template;