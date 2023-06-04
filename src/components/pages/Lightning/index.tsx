/* eslint-disable @typescript-eslint/no-misused-promises */
import { getMintsBalances, getMintsUrls } from '@db'
import type { IMintUrl } from '@model'
import type { TLightningPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { getDefaultMint } from '@store/mintStore'
import { useCallback, useContext, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import LNPageContent from './pageContent'

export default function Lightning({ navigation, route }: TLightningPageProps) {
	const { color } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	// user mints
	const [mints, setMints] = useState<IMintUrl[]>([])
	// mint selection
	const [selectedMint, setSelectedMint] = useState('')
	const setSelectedMintCB = useCallback((url: string) => setSelectedMint(url), [])
	// selected mint balance
	const [mintBal, setMintBal] = useState(0)
	// initiate user mints
	useEffect(() => {
		void (async () => {
			const userMints = await getMintsUrls()
			setMints(userMints)
			if (!userMints.length) { return }
			// set first selected mint
			const defaultMint = await getDefaultMint()
			if (!defaultMint) {
				setSelectedMint(userMints[0].mint_url)
				return
			}
			for (const mint of userMints) {
				if (mint.mint_url === defaultMint) {
					setSelectedMint(mint.mint_url)
					break
				}
			}
		})()
	}, [])
	// update mint balance after picking mint
	useEffect(() => {
		void (async () => {
			const mintsBals = await getMintsBalances()
			mintsBals.forEach(m => {
				if (m.mint_url === selectedMint) {
					setMintBal(m.amount)
				}
			})
		})()
	}, [selectedMint])
	// get mints after navigating to this page
	useEffect(() => {
		const focusHandler = navigation.addListener('focus', async () => {
			const userMints = await getMintsUrls()
			setMints(userMints)
		})
		return focusHandler
	}, [navigation])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<LNPageContent
				nav={{ navigation, route }}
				mints={mints}
				selectedMint={selectedMint}
				mintBal={mintBal}
				setSelectedMint={setSelectedMintCB}
			/>
			{!isKeyboardOpen && <BottomNav navigation={navigation} route={route} />}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
	},
})