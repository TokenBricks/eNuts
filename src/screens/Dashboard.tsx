/* eslint-disable @typescript-eslint/no-misused-promises */
import Balance from '@comps/Balance'
import { IconBtn } from '@comps/Button'
import History from '@comps/containers/History'
import useLoading from '@comps/hooks/Loading'
import useCashuToken from '@comps/hooks/Token'
import { AboutIcon, ReceiveIcon, ScanQRIcon, SendIcon, SettingsIcon } from '@comps/Icons'
import InitialModal from '@comps/InitialModal'
import Txt from '@comps/Txt'
import Button from '@comps/ui/Button'
import { _testmintUrl } from '@consts'
import { addMint, getBalance, getMintsBalances, getMintsUrls, hasMints } from '@db'
import { l } from '@log'
import OptsModal from '@modal/OptsModal'
import TrustMintModal from '@modal/TrustMint'
import type { TDashboardPageProps, TRouteString } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { useFocusClaimContext } from '@src/context/FocusClaim'
import { useInitialURL } from '@src/context/Linking'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { addToHistory } from '@store/latestHistoryEntries'
import { getCustomMintNames, saveDefaultOnInit } from '@store/mintStore'
import { highlight as hi, mainColors } from '@styles'
import { getStrFromClipboard, hasTrustedMint, isCashuToken, isStr } from '@util'
import { claimToken } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image,StyleSheet, Text,TouchableOpacity, View } from 'react-native'

export default function Dashboard({ navigation, route }: TDashboardPageProps) {
	const { t } = useTranslation([NS.common])
	// The URL content that redirects to this app after clicking on it (cashu:)
	const { url } = useInitialURL()
	// Theme
	const { color, highlight } = useThemeContext()
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useFocusClaimContext()
	// Nostr
	const { nutPub } = useNostrContext()
	const { loading, startLoading, stopLoading } = useLoading()
	// Prompt modal
	const { openPromptAutoClose } = usePromptContext()
	// Cashu token hook
	const {
		token,
		setToken,
		tokenInfo,
		setTokenInfo,
		trustModal,
		setTrustModal
	} = useCashuToken()
	// Total Balance state (all mints)
	const [balance, setBalance] = useState(0)
	const [hasMint, setHasMint] = useState(false)
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
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('clipboardInvalid') })
			closeOptsModal()
			stopLoading()
			return
		}
		for (const mint of tokenInfo.mints) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		// add token to db
		await receiveToken(token)
	}

	// navigates to the mint list page
	const handleMintModal = async (forEnutsMint = false) => {
		setModal({ ...modal, mint: false })
		await store.set(STORE_KEYS.explainer, '1')
		navigation.navigate('mints', { defaultMint: forEnutsMint, newMint: !forEnutsMint })
	}

	const handleEnutsMint = async () => {
		try {
			await saveDefaultOnInit()
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('smthWrong') })
			await handleMintModal(false)
			return
		}
		await handleMintModal(true)
	}

	// This function is only called if the mint of the received token is available as trusted in user DB
	const handleTokenSubmit = async (url: string) => {
		const tokenInfo = getTokenInfo(url)
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('clipboardInvalid') })
			closeOptsModal()
			stopLoading()
			return
		}
		// save token info in state
		setTokenInfo(tokenInfo)
		// check if user wants to trust the token mint
		const userMints = await getMintsUrls()
		if (!hasTrustedMint(userMints, tokenInfo.mints)) {
			// ask user for permission if token mint is not in his mint list
			setTrustModal(true)
			stopLoading()
			return
		}
		await receiveToken(url)
	}

	// helper function that gets called either right after pasting token or in the trust modal depending on user permission
	const receiveToken = async (encodedToken: string) => {
		const success = await claimToken(encodedToken).catch(l)
		setTrustModal(false)
		closeOptsModal()
		setToken('')
		stopLoading()
		if (!success) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			return
		}
		const info = getTokenInfo(encodedToken)
		if (!info) {
			openPromptAutoClose({ msg: t('tokenInfoErr') })
			return
		}
		// add as history entry (receive ecash)
		await addToHistory({
			amount: info.value,
			type: 1,
			value: encodedToken,
			mints: info.mints,
		})
		navigation.navigate('success', {
			amount: info?.value,
			memo: info?.decoded.memo,
			isClaim: true
		})
	}

	// get mints for send/receive process
	const getMintsForPayment = async () => {
		const mintsWithBal = await getMintsBalances()
		const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		return { mintsWithBal, mints }
	}

	// receive ecash button
	const handleClaimBtnPress = async () => {
		if (token.length) { return }
		startLoading()
		const clipboard = await getStrFromClipboard()
		if (!clipboard?.length || !isCashuToken(clipboard)) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			closeOptsModal()
			stopLoading()
			return
		}
		setToken(clipboard)
		await handleTokenSubmit(clipboard)
	}


	const handleNav = async (routeStr: TRouteString) => {
		// handle nostr explainer for addressbook
		if (routeStr === 'Address book') {
			// check if explainer has been viewed, else navigate to screen
			const nostrExplainer = await store.get(STORE_KEYS.nostrexplainer)
			navigation.navigate(!isStr(nostrExplainer) || !nostrExplainer.length ? 'nostr onboarding' : routeStr)
			return
		}
		navigation.navigate(routeStr)
	}

	// mint/melt/send ecash buttons
	const handleOptsBtnPress = async ({ isMelt, isSendEcash }: { isMelt?: boolean, isSendEcash?: boolean }) => {
		const { mintsWithBal, mints } = await getMintsForPayment()
		closeOptsModal()
		// user has only 1 mint with balance, he can skip the mint selection only for melting (he can mint new token with a mint that has no balance)
		const nonEmptyMints = mintsWithBal.filter(m => m.amount > 0)
		if ((isMelt || isSendEcash) && nonEmptyMints.length === 1) {
			// user has no nostr contacts so he can directly navigate to amount selection
			if (!nutPub.length && isSendEcash) {
				navigation.navigate('selectAmount', {
					mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
					isSendEcash,
					balance: nonEmptyMints[0].amount
				})
				return
			}
			// get remaining mints for a possible multimint swap
			const remainingMints = mints.filter(m => m.mintUrl !== _testmintUrl)
			navigation.navigate('selectTarget', {
				mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
				isMelt,
				isSendEcash,
				balance: nonEmptyMints[0].amount,
				remainingMints
			})
			return
		}
		navigation.navigate('selectMint', {
			mints,
			mintsWithBal,
			allMintsEmpty: (isMelt || isSendEcash) && !nonEmptyMints.length,
			isMelt,
			isSendEcash
		})
	}

	// close send/receive options modal
	const closeOptsModal = () => setModal(prev => ({ ...prev, receiveOpts: false, sendOpts: false }))

	useEffect(() => {
		void (async () => {
			setHasMint(await hasMints())
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// check for available mints of the user
	useEffect(() => {
		void (async () => {
			const [userHasMints, explainerSeen, balance] = await Promise.all([
				hasMints(),
				store.get(STORE_KEYS.explainer),
				getBalance(),
			])
			setHasMint(userHasMints)
			setModal({ ...modal, mint: !userHasMints && explainerSeen !== '1' })
			setBalance(balance)
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [claimed])

	// handle initial URL passed on by clicking on a cashu link
	useEffect(() => {
		void (async () => {
			if (!url) { return }
			// alert(`URL in dashboard useEffect: ${url}`)
			await handleTokenSubmit(url)
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [url])

	// get balance after navigating to this page
	useEffect(() => {
		const focusHandler = navigation.addListener('focus', async () => {
			const data = await Promise.all([
				getBalance(),
				hasMints()
			])
			setBalance(data[0])
			setHasMint(data[1])
		})
		return focusHandler
	}, [navigation])



	return (
		<View style={[styles.container, styles.bgBlack]}>
			{/* Balance, Disclaimer & History */}
			{/* <Balance balance={balance} nav={navigation} /> */}
			{/* Receive/send/mints buttons */}
			{/* <View style={[styles.actionWrap, { paddingHorizontal: !hasMint || balance < 1 ? 75 : 30 }]}>
				{(hasMint && balance > 0) &&
					<ActionBtn
						icon={<SendIcon width={32} height={32} color={hi[highlight]} />}
						txt={t('send', { ns: NS.wallet })}
						color={hi[highlight]}
						onPress={() => setModal({ ...modal, sendOpts: true })}
					/>
					:
					<ActionBtn
						icon={<PlusIcon width={36} height={36} color={hi[highlight]} />}
						txt='Mint'
						color={hi[highlight]}
						onPress={() => setModal({ ...modal, mint: true })}
					/>
				}
				<ActionBtn
					icon={<ScanQRIcon width={32} height={32} color={hi[highlight]} />}
					txt={t('scan')}
					color={hi[highlight]}
					onPress={() => navigation.navigate('qr scan', { mint: undefined })}
				/>
				<ActionBtn
					icon={<ReceiveIcon width={32} height={32} color={hi[highlight]} />}
					txt={t('receive', { ns: NS.wallet })}
					color={hi[highlight]}
					onPress={() => setModal({ ...modal, receiveOpts: true })}
				/>
			</View> */}
			{/* scan QR */}
			{/* <View style={styles.hintWrap}>
				<TouchableOpacity
					onPress={() => navigation.navigate('disclaimer')}
					style={styles.betaHint}
				>
					<AboutIcon color={mainColors.WARN} />
					<Txt txt={t('enutsBeta')} styles={[{ color: mainColors.WARN, marginHorizontal: 10 }]} />
					<ChevronRightIcon color={mainColors.WARN} />
				</TouchableOpacity>
			</View> */}
			{/* Bottom nav icons */}
			{/* <BottomNav navigation={navigation} route={route} /> */}
			{/* Question modal for mint trusting */}
			<View style={styles.header}>
				{/* <View style={styles.logo} /> */}
				<Image
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={require('@assets/CashuNest_Logo.png')}
					style={styles.logo} />
				<View style={{ marginLeft: 'auto' }}>
					<TouchableOpacity
						accessibilityRole='button'
						onPress={() => navigation.navigate('qr scan', { mint: undefined })}
					>
						<ScanQRIcon width={24} height={24} color={mainColors.WHITE} />
					</TouchableOpacity>
				</View>
				<View style={{ marginLeft: 8 }}>
					<TouchableOpacity
						accessibilityRole='button'
						onPress={() => void handleNav('Settings')}
					><SettingsIcon width={24} height={24} color={mainColors.WHITE} /></TouchableOpacity>
					
				</View>
			</View>
			<View style={styles.section}>
				<View style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:60}}>
					<Txt txt='Available balance' styles={[{ color: mainColors.WHITE }]} />
					<View style={{display:'flex', flexDirection:'row',alignItems:'flex-end',marginTop:12,gap:10}}>
						<Txt txt={balance.toString()} styles={[{color:mainColors.WHITE,fontSize:40,fontWeight:'600'}]} />
						<Txt txt='sats' styles={[{color:mainColors.WHITE,fontSize:24}]} />
					</View>
					<View  style={{display:'flex',flexDirection:'row',gap:20,marginTop:40,paddingHorizontal:24}}>
						<Button txt='Receive' onPress={() => setModal({ ...modal, receiveOpts: true })} styles={{flex:1}}></Button>
						<Button txt='Send' onPress={() => setModal({ ...modal, sendOpts: true })} styles={{flex:1}}></Button>
					</View>
				</View>
				<View style={{marginTop:40}}>
					<Txt txt='Recent Transaction' styles={[{ color: mainColors.WHITE ,fontSize:20,fontWeight:'600'}]} />
					<View style={{marginTop:16}}>
						<History />
					</View>
				</View>
			</View>
			<View style={styles.footer}>
				<BottomNav navigation={navigation} route={route} />
			</View>


			{trustModal &&
				<TrustMintModal
					loading={loading}
					tokenInfo={tokenInfo}
					handleTrustModal={() => void handleTrustModal()}
					closeModal={() => setTrustModal(false)}
				/>
			}
			{/* Initial mint modal prompt */}
			<InitialModal
				visible={modal.mint}
				onConfirm={() => void handleEnutsMint()}
				onCancel={() => void handleMintModal()}
			/>
			{/* Send options */}
			<OptsModal
				visible={modal.sendOpts}
				button1Txt={t('sendEcash')}
				onPressFirstBtn={() => void handleOptsBtnPress({ isMelt: false, isSendEcash: true })}
				button2Txt={t('payLNInvoice', { ns: NS.wallet })}
				onPressSecondBtn={() => void handleOptsBtnPress({ isMelt: true, isSendEcash: false })}
				onPressCancel={closeOptsModal}
				isSend
			/>
			{/* Receive options */}
			<OptsModal
				visible={modal.receiveOpts}
				button1Txt={loading ? t('claiming', { ns: NS.wallet }) : t('pasteToken', { ns: NS.wallet })}
				onPressFirstBtn={() => void handleClaimBtnPress()}
				button2Txt={t('createLnInvoice', { ns: NS.wallet })}
				onPressSecondBtn={() => void handleOptsBtnPress({ isMelt: false, isSendEcash: false })}
				handleNostrReceive={() => {
					closeOptsModal()
					navigation.navigate('nostrReceive')
				}}
				onPressCancel={closeOptsModal}
				loading={loading}
			/>
		</View>
	)
}

interface IActionBtnsProps {
	icon: React.ReactNode
	txt: string
	onPress: () => void
	color: string
	disabled?: boolean
}

function ActionBtn({ icon, onPress, txt, color, disabled }: IActionBtnsProps) {
	return (
		<View style={styles.btnWrap}>
			<IconBtn
				icon={icon}
				size={70}
				outlined
				onPress={onPress}
				disabled={disabled}
			/>
			<Txt
				txt={txt}
				styles={[styles.btnTxt, { color, opacity: disabled ? .5 : 1 }]}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	bgBlack: {
		backgroundColor: mainColors.BLACK
	},
	header:{
		display: 'flex',
		flexDirection: 'row',
		paddingHorizontal:16,
	},
	section: {
		// backgroundColor: mainColors.WHITE,	
		display: 'flex',
		flex: 1,
		paddingHorizontal:16,
		// height: '100%'
	},
	footer: {
		// padding: 40,
		// backgroundColor: 'rgba(255,255,255,0.08)',
		// opacity:0.08 
	},
	logo: {
		width: 110,
		height: 24,
	},
	container: {
		flex: 1,
		paddingTop: 80,
	},
	actionWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: -35,
	},
	btnWrap: {
		alignItems: 'center',
		minWidth: 100
	},
	btnTxt: {
		fontWeight: '500',
		marginTop: 10,
	},
	hintWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 50,
	},
	betaHint: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10
	},
})
