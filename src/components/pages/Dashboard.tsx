/* eslint-disable @typescript-eslint/no-misused-promises */
import Balance from '@comps/Balance'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import useCashuToken from '@comps/hooks/Token'
import { addMint, getBalance, getMintsUrls, hasMints } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import OptsModal from '@modal/OptsModal'
import { PromptModal } from '@modal/Prompt'
import TrustMintModal from '@modal/TrustMint'
import { TDashboardPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { useInitialURL } from '@src/context/Linking'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { highlight as hi } from '@styles/colors'
import { globals } from '@styles/globals'
import { isCashuToken, isTrustedMint } from '@util'
import { claimToken } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import * as Clipboard from 'expo-clipboard'
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function Dashboard({ navigation, route }: TDashboardPageProps) {
	// The URL content that redirects to this app after clicking on it (cashu:)
	const { url } = useInitialURL()
	// Theme
	const { color, highlight } = useContext(ThemeContext)
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useContext(FocusClaimCtx)
	// Total Balance state (all mints)
	const [balance, setBalance] = useState(0)
	// Prompt modal
	const { prompt, openPrompt, closePrompt } = usePrompt()
	// Cashu token hook
	const {
		token,
		setToken,
		tokenInfo,
		setTokenInfo,
		trustModal,
		setTrustModal
	} = useCashuToken()
	const { loading, startLoading, stopLoading } = useLoading()
	// modals
	const [modal, setModal] = useState({
		mint: false,
		receiveOpts: false,
		sendOpts: false
	})

	// This function is only called if the mints of the received token are not in the user DB
	const handleTrustModal = async () => {
		if (loading) { return }
		startLoading()
		// TODO Maybe we should provide the user the possibility to choose mints
		// in the trust modal-question once multiple mints per token are available...
		if (!tokenInfo) {
			openPrompt('Your clipboard contains an invalid cashu token!')
			setModal({ ...modal, receiveOpts: false })
			stopLoading()
			return
		}
		// TODO only add chosen mints by the user
		for (const mint of tokenInfo.mints) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		// add token to db
		await receiveToken(token)
	}

	// navigates to the mint list page
	const handleMintModal = () => {
		setModal({ ...modal, mint: false })
		navigation.navigate('mints')
	}

	// This function is only called if the mint of the received token is available as trusted in user DB
	const handleTokenSubmit = async (url: string) => {
		const tokenInfo = getTokenInfo(url)
		if (!tokenInfo) {
			openPrompt('Your clipboard contains an invalid cashu token!')
			setModal({ ...modal, receiveOpts: false })
			stopLoading()
			return
		}
		// save token info in state
		setTokenInfo(tokenInfo)
		// check if user wants to trust the token mint
		const userMints = await getMintsUrls()
		// TODO update this check for future multiple mints of token
		if (!isTrustedMint(userMints, tokenInfo.mints)) {
			// ask user for permission if token mint is not in his mint list
			setTrustModal(true)
			return
		}
		await receiveToken(url)
	}

	// helper function that gets called either right after submitting input or in the trust modal depending on user permission
	const receiveToken = async (encodedToken: string) => {
		const success = await claimToken(encodedToken).catch(l)
		setTrustModal(false)
		setModal({ ...modal, receiveOpts: false })
		setToken('')
		stopLoading()
		if (!success) {
			openPrompt('Token invalid or already claimed')
			return
		}
		const info = getTokenInfo(encodedToken)
		if (!info) {
			l('Error while getting token info')
			return
		}
		// add as history entry
		await addToHistory({
			amount: info.value,
			type: 1,
			value: encodedToken,
			mints: info.mints,
		})
		navigation.navigate('success', {
			amount: info?.value,
			mints: info?.mints
		})
	}

	// check for available mints of the user
	useEffect(() => {
		void (async () => {
			const hasUserMints = await hasMints()
			setModal({ ...modal, mint: !hasUserMints })
			setBalance(await getBalance())
		})()
	}, [claimed])

	// handle initial URL passed on by clicking on a cashu link
	useEffect(() => {
		void (async () => {
			if (!url) { return }
			// alert(`URL in dashboard useEffect: ${url}`)
			await handleTokenSubmit(url)
		})()
	}, [url])

	// get balance after navigating to this page
	useEffect(() => {
		const focusHandler = navigation.addListener('focus', async () => {
			setBalance(await getBalance())
		})
		return focusHandler
	}, [navigation])

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav nav={{ navigation, route }} />
			{/* Balance overview */}
			<Balance balance={balance} />
			{/* Flex space-between empty placeholder */}
			<View />
			{/* Token input & submit button */}
			<View style={styles.actionWrap}>
				{/* Claim token */}
				<Button
					txt='Receive'
					onPress={() => setModal({ ...modal, receiveOpts: true })}
				/>
				<View style={{ marginVertical: 10 }} />
				{/* Send token */}
				<Button
					outlined
					txt='Send'
					onPress={() => setModal({ ...modal, sendOpts: true })}
				/>
			</View>
			{/* Bottom nav icons */}
			<BottomNav navigation={navigation} route={route} />
			{/* Question modal for mint trusting */}
			{trustModal &&
				<TrustMintModal
					loading={loading}
					tokenInfo={tokenInfo}
					handleTrustModal={handleTrustModal}
					closeModal={() => setTrustModal(false)}
				/>
			}
			{/* Initial mint modal prompt */}
			{modal.mint &&
				<MyModal type='bottom' animation='slide' visible={modal.mint}>
					<Text style={globals(color, highlight).modalHeader}>
						Get started
					</Text>
					<Text style={globals(color, highlight).modalTxt}>
						You should add a mint that you trust before sending or receiving tokens.
					</Text>
					<Button txt='Add a mint now' onPress={handleMintModal} />
					<TouchableOpacity onPress={() => setModal({ ...modal, mint: false })}>
						<Text style={[styles.cancel, { color: hi[highlight] }]}>
							Will do later
						</Text>
					</TouchableOpacity>
				</MyModal>
			}
			{/* Receive options */}
			{modal.receiveOpts &&
				<OptsModal
					visible={modal.receiveOpts}
					button1Txt='Paste & redeem ecash'
					onPressFirstBtn={() => {
						if (token.length) { return }
						void (async () => {
							const clipboard = await Clipboard.getStringAsync()
							if (!isCashuToken(clipboard)) {
								openPrompt('Your clipboard contains an invalid cashu token!')
								setModal({ ...modal, receiveOpts: false })
								return
							}
							setToken(clipboard)
							await handleTokenSubmit(clipboard)
						})()
					}}
					button2Txt='Create Lightning invoice'
					onPressSecondBtn={() => {
						navigation.navigate('lightning', { receive: true })
						setModal({ ...modal, receiveOpts: false })
					}}
					onPressCancel={() => setModal({ ...modal, receiveOpts: false })}
				/>
			}
			{/* Send options */}
			{modal.sendOpts &&
				<OptsModal
					visible={modal.sendOpts}
					button1Txt='Send ecash'
					onPressFirstBtn={() => {
						navigation.navigate('send')
						setModal({ ...modal, sendOpts: false })
					}}
					button2Txt='Pay Lightning invoice'
					onPressSecondBtn={() => {
						navigation.navigate('lightning', { send: true })
						setModal({ ...modal, sendOpts: false })
					}}
					onPressCancel={() => setModal({ ...modal, sendOpts: false })}
				/>
			}
			{/* Prompt modal */}
			<PromptModal
				header={prompt.msg}
				visible={prompt.open}
				close={closePrompt}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	actionWrap: {
		width: '100%',
		paddingLeft: 20,
		paddingRight: 20,
		marginBottom: 100,
	},
	// Modal content
	cancel: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 25,
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		right: 10,
		top: 10,
		padding: 10
	},
	pasteInputTxt: {
		fontSize: 16,
		fontWeight: '500',
	},
	historyWrap: {
		marginVertical: 10
	}
})