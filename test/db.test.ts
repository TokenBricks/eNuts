
import { getDatabase } from './wrapper/getTestDb'

jest.mock('expo-sqlite', () => ({
	get openDatabase() {
		return (_: string) => getDatabase(':memory:')
	}
}))

import {
	addInvoice,
	addMint,
	addMints,
	hasMints,

	delInvoice,
	getAllInvoices,
	getInvoice,
	
	initDb
} from '@db'




describe('test db helper', () => {
	beforeAll(async () => { await initDb() })
	test('test mint add', async () => {
		// test hasMints
		expect(await hasMints()).toBe(false)
		// add mint
		expect(await addMint('test', 'testid')).toBe(true)
		// add mints
		expect(await addMints(
			{ mintUrl: 'testMany', id: 'testManyId' },
			{ mintUrl: 'testMany2', id: 'testManyId2' },
		)).toBe(true)

	})
	test('test db Invoice', async () => {
		// setup vars
		const time = Math.ceil(Date.now() / 1000) - 60
		const invoiceTest = { pr: 'pr', hash: 'hash', amount: 100, mint_url: 'minturl' }
		

		// test addInvoice
		expect(await addInvoice(
			{ pr: 'pr', hash: 'hash', amount: 100, mint_url: 'minturl' }
		)).toBe(true)

		// test getInvoice
		const invoice = await getInvoice('hash')
		expect(invoice).toBeTruthy()
		expect(invoice)
			.toMatchObject(invoiceTest)
		expect(invoice?.time).toBeGreaterThanOrEqual(time)
		// test getAllInvoices
		expect(await getAllInvoices()).toMatchObject([invoiceTest])
		// test delInvoice
		expect(await delInvoice('hash')).toBe(true)
		// test getAllInvoices
		expect(await getAllInvoices()).toStrictEqual([])
	})
})