import { Voucher } from "@prisma/client";
import voucherRepository from "../repositories/voucherRepository";
import { badRequestError, conflictError } from "../utils/errorUtils";

const MIN_VALUE_FOR_DISCOUNT = 100;

export type VoucherCreateData = Omit<Voucher, "id">;
export interface VoucherApplyData {
  code: string;
  amount: number;
}

async function createVoucher(code: string, discount: number) {
  const voucher = await voucherRepository.getVoucherByCode(code);
  if (voucher) {
    throw conflictError("Voucher already exist.");
  }

  return await voucherRepository.createVoucher(code, discount);
}

async function applyVoucher(code: string, amount: number) {
  const voucher = await voucherRepository.getVoucherByCode(code);
  if (!voucher) {
    throw conflictError("Voucher does not exist.");
  }

  if(voucher.used){
    throw badRequestError("Voucher already used.");
  }
  
  let finalAmount = amount;
  console.log(isAmountValidForDiscount(amount))
  if (isAmountValidForDiscount(amount)) {
    await changeVoucherToUsed(code);
    finalAmount = applyDiscount(amount, voucher.discount);
  } else {
    throw badRequestError("Voucher does not allowed for discount.");
  }

  return {
    amount,
    discount: voucher.discount,
    finalAmount,
    applied: finalAmount !== amount
  }
}

async function changeVoucherToUsed(code: string) {
  return await voucherRepository.useVoucher(code);
}

function isAmountValidForDiscount(amount: number): boolean {
  return amount >= MIN_VALUE_FOR_DISCOUNT;
}

function applyDiscount(value: number, discount: number) {
  return value - (value * (discount / 100));
}

export default {
  createVoucher,
  applyVoucher,
  applyDiscount,
  isAmountValidForDiscount,
  changeVoucherToUsed
}