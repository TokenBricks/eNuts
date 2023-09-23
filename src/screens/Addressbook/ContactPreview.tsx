import { ChevronRightIcon, LeftArrow, RightArrow } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { TContact } from '@model/nostr'
import { truncateNostrProfileInfo, truncateNpub } from '@nostr/util'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { highlight as hi, mainColors } from '@styles'
import { nip19 } from 'nostr-tools'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import ProfilePic from './ProfilePic'
import Username from './Username'

interface IContactPreviewProps {
  contact: TContact;
  handleContactPress: () => void;
  handleSend: () => void;
  isFirst: boolean;
  isLast: boolean;
  isPayment?: boolean;
}

const COLORS = ['#F0BD47','#3A70FF','#E45252','#708E34','#B17CE6']

export default function ContactPreview({
	contact,
	handleContactPress,
	handleSend,
	isFirst,
	isLast,
	isPayment,
}: IContactPreviewProps) {
	const { color,highlight } = useThemeContext()
	return (
		<TouchableOpacity
			onPress={() => {
				if (isPayment) {
					handleContactPress()
					return
				}
				handleSend()
			}}
			disabled={!isPayment}
			style={[styles.container]}>
			<TouchableOpacity onPress={handleContactPress} disabled={isPayment} style={styles.colWrap}>
				{/* <ProfilePic uri={contact[1]?.picture} /> */}
				<View
					style={{
						width: 40,
						height: 40,
						backgroundColor: 'rgba(255, 255, 255, 0.10)',
						borderRadius: 999,
						marginRight: 20,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}>
					<Text style={{fontSize:20,color:COLORS[Math.floor(Math.random()*5)]}}>{(contact[1]?.displayName||contact[1]?.display_name)?.[0]}</Text>
				</View>

				{contact[1] ? (
					<View>
						<Username
							displayName={contact[1].displayName}
							display_name={contact[1].display_name}
							username={contact[1].username}
							name={contact[1].name}
							npub={truncateNpub(nip19.npubEncode(contact[0]))}
							fontSize={16}
						/>
						{contact[1].about?.length > 0 && (
							<Txt
								txt={truncateNostrProfileInfo(contact[1].about)}
								styles={[{ color: color.TEXT_SECONDARY, fontSize: 14 }]}
							/>
						)}
					</View>
				) : (
					<Txt txt={truncateNpub(nip19.npubEncode(contact[0]))} styles={[{ fontWeight: '500' }]} />
				)}

				{isPayment && contact[1] ? (
					<ChevronRightIcon width={16} height={16} color={color.TEXT} />
				) : !isPayment && contact[1] ? (
					<TouchableOpacity
						style={[styles.sendEcashBtn, { backgroundColor: hi[highlight], marginLeft:'auto' }]}
						onPress={handleSend}
					>
						<Txt txt='send' styles={[styles.sendTxt]} />
					</TouchableOpacity>
				) : null}
			</TouchableOpacity>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 6,
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	colWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
	},
	sendEcashBtn: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 50,
	},
	sendTxt: {
		color: mainColors.WHITE,
		fontWeight: '500',
	},
	circle: {
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 5,
		marginRight: 20,
		zIndex: 2,
	},
})
