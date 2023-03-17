import { jest } from '@jest/globals'
import { Voucher } from '@prisma/client'
import voucherRepository from 'repositories/voucherRepository'
import voucherService from 'services/voucherService'

let voucher: Voucher = {
    id: 1,
    code: 'FRETEGRATIS',
    discount: 50,
    used: true
}

describe('Create voucher testing', () => {
    it('When send code already exist throw error', async () => {
   
        jest.spyOn(voucherRepository, 'getVoucherByCode').mockImplementationOnce((): any => voucher);

        try {
            await voucherService.createVoucher('FRETEGRATIS', 50);
        } catch (error){
            return expect(error).toStrictEqual( { type: 'conflict', message: 'Voucher already exist.' });
        }
    })

    it('When send code not exist result success', async () => {

        jest.spyOn(voucherRepository, 'getVoucherByCode').mockImplementationOnce((): any => null);
        
        jest.spyOn(voucherRepository, 'createVoucher').mockImplementationOnce((): any => voucher);

        const response = await voucherService.createVoucher('FRETEGRATIS', 50)
        return expect(response).toBeTruthy()
    })
})

describe('Apply voucher testing', () => {
    it('When apply voucher and voucher not exist throw error', async () => {
        jest.spyOn(voucherRepository, 'getVoucherByCode').mockImplementationOnce((): any => null);

        try {
            await voucherService.applyVoucher('FRETEGRATIS', 50)
        } catch (error) {
            return expect(error).toStrictEqual( { type: 'conflict', message: 'Voucher does not exist.' });
        }
    })

    it('When apply voucher and voucher already used throw error', async () => {
        voucher.used = true;
        jest.spyOn(voucherRepository, 'getVoucherByCode').mockImplementationOnce((): any => voucher);
    
        try {
            await voucherService.applyVoucher('FRETEGRATIS', 50);
        } catch (error) {
            return expect(error).toStrictEqual( { type: 'bad_request', message: 'Voucher already used.' });
        }
    })

    it('When apply voucher and voucher is not valid for discount', () => {
        expect(async () => {
            voucher.used = false;
            jest.spyOn(voucherRepository, 'getVoucherByCode').mockImplementationOnce((): any => voucher);
            
            jest.spyOn(voucherService, 'isAmountValidForDiscount').mockImplementationOnce(() => false);
            
            await voucherService.applyVoucher('FRETEGRATIS', 50);
        }).rejects.toStrictEqual({ type: 'bad_request', message: 'Voucher does not allowed for discount.' });
    })

    it('When apply voucher return sucessfully response', async () => {
        voucher.used = false;
        jest.spyOn(voucherRepository, 'getVoucherByCode').mockImplementationOnce((): any => voucher);
        
        jest.spyOn(voucherService, 'isAmountValidForDiscount').mockImplementationOnce(() => true);

        jest.spyOn(voucherRepository, 'useVoucher').mockImplementationOnce((): any => {
            voucher.used= true;
            return voucher;
        });
        
        jest.spyOn(voucherService, 'applyDiscount').mockImplementationOnce(() => 50);

        const response = await voucherService.applyVoucher('FRETEGRATIS', 100);
        return expect(response).toBeTruthy()
    })
})